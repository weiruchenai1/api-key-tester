async function testApiKey(apiKey, apiType) {
	let result;
	switch (apiType) {
		case 'openai':
			if (typeof window !== 'undefined' && window.testOpenAIKey) {
				result = await window.testOpenAIKey(apiKey);
			} else {
				result = { valid: false, error: 'OpenAI service not loaded', isRateLimit: false };
			}
			break;
		case 'claude':
			if (typeof window !== 'undefined' && window.testClaudeKey) {
				result = await window.testClaudeKey(apiKey);
			} else {
				result = { valid: false, error: 'Claude service not loaded', isRateLimit: false };
			}
			break;
		case 'gemini':
			if (typeof window !== 'undefined' && window.testGeminiKey) {
				result = await window.testGeminiKey(apiKey);
			} else {
				result = { valid: false, error: 'Gemini service not loaded', isRateLimit: false };
			}
			break;
		default:
			result = { valid: false, error: '不支持的API类型', isRateLimit: false };
	}
	if (!result.valid && result.error && (result.error.includes('429') || result.error.includes('请求过多') || result.error.toLowerCase().includes('rate limit') || result.error.toLowerCase().includes('too many requests'))) {
		result.isRateLimit = true;
	}
	return result;
}

try {
	if (typeof window !== 'undefined') {
		window.testApiKey = testApiKey;
	}
} catch (_) {}



