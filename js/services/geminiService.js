async function getGeminiModels(apiKey) {
	try {
		const apiUrl = getApiUrl('gemini', '/models?key=' + apiKey);
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		if (!response.ok) {
			if (response.status === 400 || response.status === 401 || response.status === 403) {
				return [];
			}
			return [];
		}
		const data = await response.json();
		if (data && data.models && Array.isArray(data.models)) {
			const models = data.models
				.filter(model => model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent'))
				.map(model => model.name.replace('models/', ''))
				.sort();
			return models;
		}
		return [];
	} catch (error) {
		return [];
	}
}

async function testGeminiKey(apiKey, model = null) {
	try {
		const selectedModel = model || getSelectedModel();
		if (!selectedModel) {
			return { valid: false, error: '未指定模型', isRateLimit: false };
		}
		const apiUrl = getApiUrl('gemini', '/models/' + selectedModel + ':generateContent?key=' + apiKey);
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [ { parts: [ { text: 'Hi' } ] } ]
			})
		});
		if (!response.ok) {
			if (response.status === 400) return { valid: false, error: 'API密钥无效 (400)', isRateLimit: false };
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
		if (data && data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
			let isPaid;
			try {
				if (typeof testGeminiContextCaching === 'function') {
					const paidRes = await testGeminiContextCaching(apiKey);
					isPaid = !!(paidRes && paidRes.isPaid);
				}
			} catch (_) {}
			return { valid: true, error: null, isRateLimit: false, isPaid };
		} else if (data && data.error) {
			const errorMessage = data.error.message || data.error.toString();
			if (errorMessage.toLowerCase().includes('quota exceeded') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')) {
				return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true };
			}
			return { valid: false, error: 'API错误: ' + errorMessage, isRateLimit: false };
		} else {
			return { valid: false, error: '响应格式错误', isRateLimit: false };
		}
	} catch (error) {
		if (error.name === 'TypeError' && error.message.includes('fetch')) {
			return { valid: false, error: '网络连接失败', isRateLimit: false };
		}
		if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
			return { valid: false, error: 'JSON解析失败', isRateLimit: false };
		}
		return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
	}
}

try {
	if (typeof window !== 'undefined') {
		window.getGeminiModels = getGeminiModels;
		window.testGeminiKey = testGeminiKey;
	}
} catch (_) {}


