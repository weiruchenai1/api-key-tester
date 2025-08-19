function testGeminiContextCaching(apiKey) {
	const url = getApiUrl('gemini', '/cachedContents') + '?key=' + encodeURIComponent(apiKey);
	const textLen = (typeof featureFlags !== 'undefined' && featureFlags.paidDetectionMinTextLen) ? featureFlags.paidDetectionMinTextLen : 8000;
	const body = {
		model: 'models/gemini-2.5-flash',
		contents: [{ role: 'user', parts: [{ text: 'x'.repeat(textLen) }] }],
		ttl: '30s'
	};
	return fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	}).then(async (res) => {
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
	}).catch((e) => {
		return { isPaid: false, reason: 'network:' + (e && e.message ? e.message : 'error') };
	});
}

try {
	if (typeof window !== 'undefined') {
		window.testGeminiContextCaching = testGeminiContextCaching;
	}
} catch (_) {}




