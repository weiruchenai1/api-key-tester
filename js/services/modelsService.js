async function getAvailableModels(apiKey, apiType) {
	switch (apiType) {
		case 'openai':
			return await getOpenAIModels(apiKey);
		case 'claude':
			return await getClaudeModels(apiKey);
		case 'gemini':
			return await getGeminiModels(apiKey);
		default:
			return [];
	}
}

try {
	if (typeof window !== 'undefined') {
		window.getAvailableModels = getAvailableModels;
	}
} catch (_) {}


