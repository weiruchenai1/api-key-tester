async function testApiKeyWithRetry(apiKey, apiType, maxRetries = 0) {
	const keyData = (typeof allKeysData !== 'undefined') ? allKeysData.find(k => k.key === apiKey) : null;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			if (keyData) {
				if (attempt === 0) {
					keyData.status = 'testing';
					keyData.retryCount = 0;
				} else {
					keyData.status = 'retrying';
					keyData.retryCount = attempt;
					await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
				}
				if (typeof updateUIAsync === 'function') updateUIAsync();
			}
			const result = await testApiKey(apiKey, apiType);
			if (result.valid || result.isRateLimit) {
				return finalizeResult(keyData, result, attempt);
			}
			if (attempt === maxRetries) {
				return finalizeResult(keyData, result, attempt);
			}
			const statusCode = extractStatusCode(result.error);
			if (!shouldRetry(result.error, statusCode)) {
				return finalizeResult(keyData, result, attempt);
			}
		} catch (error) {
			if (attempt === maxRetries) {
				const errorResult = { valid: false, error: '测试异常: ' + error.message, isRateLimit: false };
				return finalizeResult(keyData, errorResult, attempt);
			}
			if (keyData) {
				keyData.status = 'retrying';
				keyData.retryCount = attempt + 1;
				if (typeof updateUIAsync === 'function') updateUIAsync();
			}
		}
	}
}

function shouldRetry(error, statusCode) {
	if ([403, 502, 503, 504].includes(statusCode)) return true;
	if (error && typeof error === 'string') {
		const errorLower = error.toLowerCase();
		if (errorLower.includes('timeout') || errorLower.includes('network') || errorLower.includes('连接') || errorLower.includes('fetch')) {
			return true;
		}
	}
	return false;
}

function extractStatusCode(error) {
	if (!error || typeof error !== 'string') return null;
	const match = error.match(/\((\d{3})\)/);
	if (match) return parseInt(match[1]);
	if (error.includes('HTTP ')) {
		const httpMatch = error.match(/HTTP (\d{3})/);
		if (httpMatch) return parseInt(httpMatch[1]);
	}
	return null;
}

try {
	if (typeof window !== 'undefined') {
		window.testApiKeyWithRetry = testApiKeyWithRetry;
		window.shouldRetry = shouldRetry;
		window.extractStatusCode = extractStatusCode;
	}
} catch (_) {}


