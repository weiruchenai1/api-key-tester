async function testApiKey(apiKey, apiType) {
	let result;
	switch (apiType) {
		case 'openai':
			result = await testOpenAIKey(apiKey);
			break;
		case 'claude':
			result = await testClaudeKey(apiKey);
			break;
		case 'gemini':
			result = await testGeminiKey(apiKey);
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



