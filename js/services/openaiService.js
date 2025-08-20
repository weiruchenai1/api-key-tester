async function getOpenAIModels(apiKey) {
	try {
		const apiUrl = getApiUrl('openai', '/models');
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + apiKey,
				'Content-Type': 'application/json'
			}
		});
		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				return [];
			}
			return [];
		}
		const data = await response.json();
		if (data && data.data && Array.isArray(data.data)) {
			const models = data.data
				.filter(model => {
					const id = model.id.toLowerCase();
					return !id.includes('embed') &&
						!id.includes('whisper') &&
						!id.includes('tts') &&
						!id.includes('dall-e') &&
						!id.includes('moderation') &&
						!id.includes('search') &&
						!id.includes('similarity');
				})
				.map(model => model.id)
				.sort();
			return models;
		}
		return [];
	} catch (error) {
		return [];
	}
}

async function testOpenAIKey(apiKey, model = null) {
	try {
		const selectedModel = model || getSelectedModel();
		if (!selectedModel) {
			return { valid: false, error: '未指定模型', isRateLimit: false };
		}
		const apiUrl = getApiUrl('openai', '/chat/completions');
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + apiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: selectedModel,
				messages: [{ role: 'user', content: 'Hi' }],
				max_tokens: 1
			})
		});
		if (!response.ok) {
			if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false };
			if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false };
			if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true };
			return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429 };
		}
		const responseText = await response.text();
		if (!responseText || responseText.trim() === '') {
			return { valid: false, error: '空响应', isRateLimit: false };
		}
		let data;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			return { valid: false, error: 'JSON解析失败', isRateLimit: false };
		}
		if (data && data.error) {
			const errorMessage = data.error.message || data.error.toString();
			if (errorMessage.toLowerCase().includes('rate limit') ||
				errorMessage.toLowerCase().includes('too many requests') ||
				errorMessage.toLowerCase().includes('quota exceeded')) {
				return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true };
			}
		}
		if (data && data.choices && Array.isArray(data.choices)) {
			return { valid: true, error: null, isRateLimit: false };
		} else {
			return { valid: false, error: '响应格式错误', isRateLimit: false };
		}
	} catch (error) {
		if (error.name === 'TypeError' && error.message.includes('fetch')) {
			return { valid: false, error: '网络连接失败', isRateLimit: false };
		}
		return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
	}
}

// 兼容测试与运行时：将方法挂到 window 便于直接访问
try {
	if (typeof window !== 'undefined') {
		window.getOpenAIModels = getOpenAIModels;
		window.testOpenAIKey = testOpenAIKey;
	}
} catch (_) {}


