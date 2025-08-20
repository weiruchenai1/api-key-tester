// Step 5: 并发上限与 429 指数退避
let _paidInFlight = 0;
const _paidQueue = [];

function _getPaidLimits() {
	const max = (typeof featureFlags !== 'undefined' && featureFlags.paidDetectionMaxConcurrency) ? featureFlags.paidDetectionMaxConcurrency : 5;
	const backoff = (typeof featureFlags !== 'undefined' && featureFlags.paidDetectionBackoff) ? featureFlags.paidDetectionBackoff : { baseMs: 500, factor: 2, maxMs: 8000, retries: 2 };
	const minTextLen = (typeof featureFlags !== 'undefined' && featureFlags.paidDetectionMinTextLen) ? featureFlags.paidDetectionMinTextLen : 8000;
	return { max, backoff, minTextLen };
}

// 估算字符数转 token 数（粗略估算：英文 ~4 字符 = 1 token）
function _estimateTokens(text) {
	return Math.ceil(text.length / 4);
}

function _startNextIfPossible() {
	const { max } = _getPaidLimits();
	while (_paidInFlight < max && _paidQueue.length > 0) {
		const next = _paidQueue.shift();
		next();
	}
}

function _withPaidLimiter(task) {
	return new Promise((resolve) => {
		const run = () => {
			_paidInFlight++;
			// Debug 日志
			if (typeof featureFlags !== 'undefined' && featureFlags.debugQueue) {
				console.debug('[geminiPaid] start task, inFlight:', _paidInFlight, 'queue:', _paidQueue.length);
			}
			Promise.resolve()
				.then(task)
				.then(resolve)
				.catch((err) => {
					try {
						resolve({ isPaid: false, reason: 'limiter_error:' + (err && err.message ? err.message : 'error') });
					} catch (_) {
						resolve({ isPaid: false, reason: 'limiter_error' });
					}
				})
				.finally(() => {
					_paidInFlight--;
					_startNextIfPossible();
					// Debug 日志
					if (typeof featureFlags !== 'undefined' && featureFlags.debugQueue) {
						console.debug('[geminiPaid] task done, inFlight:', _paidInFlight, 'queue:', _paidQueue.length);
					}
				});
		};
		const { max } = _getPaidLimits();
		if (_paidInFlight < max) {
			run();
		} else {
			if (typeof featureFlags !== 'undefined' && featureFlags.debugQueue) {
				console.debug('[geminiPaid] queued, inFlight:', _paidInFlight, 'queue:', _paidQueue.length + 1);
			}
			_paidQueue.push(run);
		}
	});
}

function _sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function _performCachedRequest(apiKey) {
	const { minTextLen } = _getPaidLimits();
	const url = getApiUrl('gemini', '/cachedContents') + '?key=' + encodeURIComponent(apiKey);
	const baseText = "You are an expert at analyzing API key capabilities and testing system functionality.";
	const repeatedText = baseText.repeat(Math.ceil(minTextLen / baseText.length));
	const finalText = repeatedText.substring(0, minTextLen);
	
	// Debug 信息：显示估算的 token 数量
	if (typeof featureFlags !== 'undefined' && featureFlags.debugQueue) {
		const estimatedTokens = _estimateTokens(finalText);
		console.debug('[geminiPaid] 生成测试文本:', finalText.length, '字符, 估算', estimatedTokens, 'tokens');
	}
	
	const body = {
		model: 'models/gemini-2.5-flash',
		contents: [{ role: 'user', parts: [{ text: finalText }] }],
		ttl: '30s'
	};
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (res.ok) return { isPaid: true, reason: 'cached_ok' };
		let err;
		try { err = await res.json(); } catch (_) { err = null; }
		const code = ((err && (err.error && (err.error.code || err.error.status))) || '').toString().toUpperCase();
		const msg = ((err && err.error && err.error.message) || '').toLowerCase();
		if (res.status === 403 || code.includes('PERMISSION_DENIED') || msg.includes('permission')) {
			return { isPaid: false, reason: 'permission_denied' };
		}
		if (res.status === 429 || code.includes('RESOURCE_EXHAUSTED')) {
			return { isPaid: false, reason: 'rate_limited' };
		}
		return { isPaid: false, reason: 'http_' + (res.status || 'unknown') };
	} catch (e) {
		return { isPaid: false, reason: 'network:' + (e && e.message ? e.message : 'error') };
	}
}

function testGeminiContextCaching(apiKey) {
	return _withPaidLimiter(async () => {
		const { backoff } = _getPaidLimits();
		let attempt = 0;
		let delay = backoff.baseMs || 500;
		while (true) {
			const res = await _performCachedRequest(apiKey);
			if (res && res.reason === 'rate_limited' && attempt < (backoff.retries || 0)) {
				await _sleep(Math.min(delay, backoff.maxMs || delay));
				delay = Math.min(delay * (backoff.factor || 2), backoff.maxMs || delay);
				attempt++;
				continue;
			}
			return res;
		}
	});
}

try {
	if (typeof window !== 'undefined') {
		window.testGeminiContextCaching = testGeminiContextCaching;
	}
} catch (_) {}




