function toggleLanguage() {
	currentLang = currentLang === 'zh' ? 'en' : 'zh';
	updateLanguage();
}

function updateLanguage() {
	const elements = document.querySelectorAll('[data-lang-key]');
	elements.forEach(element => {
		const key = element.getAttribute('data-lang-key');
		if (translations[currentLang][key]) {
			if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
				element.placeholder = translations[currentLang][key];
			} else {
				element.textContent = translations[currentLang][key];
			}
		}
	});
	if (typeof updateModelOptions === 'function') updateModelOptions();
	if (typeof updateKeyLists === 'function') updateKeyLists();
}

function getLocalizedError(errorKey) {
	if (errorKey && (errorKey.includes('429') || errorKey.includes('Rate Limited') || errorKey.toLowerCase().includes('rate limit'))) {
		if (currentLang === 'zh') {
			if (errorKey.includes('Rate Limited (429)')) {
				return '速率限制 (429)';
			} else if (errorKey.includes('Rate Limited')) {
				return '速率限制';
			} else if (errorKey.includes('429')) {
				return '速率限制 (429)';
			}
			return '速率限制';
		} else {
			return errorKey;
		}
	}

	const errorMap = {
		'认证失败 (401)': currentLang === 'zh' ? '认证失败 (401)' : 'Auth Failed (401)',
		'权限不足 (403)': currentLang === 'zh' ? '权限不足 (403)' : 'Permission Denied (403)',
		'请求过多 (429)': currentLang === 'zh' ? '请求过多 (429)' : 'Too Many Requests (429)',
		'Rate Limited (429)': currentLang === 'zh' ? '速率限制 (429)' : 'Rate Limited (429)',
		'网络连接失败': currentLang === 'zh' ? '网络连接失败' : 'Network Connection Failed',
		'JSON解析失败': currentLang === 'zh' ? 'JSON解析失败' : 'JSON Parse Failed',
		'空响应': currentLang === 'zh' ? '空响应' : 'Empty Response',
		'响应格式错误': currentLang === 'zh' ? '响应格式错误' : 'Invalid Response Format',
		'认证错误': currentLang === 'zh' ? '认证错误' : 'Authentication Error',
		'未指定模型': currentLang === 'zh' ? '未指定模型' : 'No Model Specified',
		'API密钥无效 (400)': currentLang === 'zh' ? 'API密钥无效 (400)' : 'Invalid API Key (400)',
		'测试异常': currentLang === 'zh' ? '测试异常' : 'Test Exception',
		'重试失败': currentLang === 'zh' ? '重试失败' : 'Retry Failed',
		'不支持的API类型': currentLang === 'zh' ? '不支持的API类型' : 'Unsupported API Type'
	};

	if (errorMap[errorKey]) {
		return errorMap[errorKey];
	}

	if (errorKey && errorKey.startsWith('API错误:')) {
		const detail = errorKey.replace('API错误:', '').trim();
		return currentLang === 'zh' ? 'API错误: ' + detail : 'API Error: ' + detail;
	}

	if (errorKey && errorKey.startsWith('请求失败:')) {
		const detail = errorKey.replace('请求失败:', '').trim();
		return currentLang === 'zh' ? '请求失败: ' + detail : 'Request Failed: ' + detail;
	}

	if (errorKey && errorKey.startsWith('测试异常:')) {
		const detail = errorKey.replace('测试异常:', '').trim();
		return currentLang === 'zh' ? '测试异常: ' + detail : 'Test Exception: ' + detail;
	}

	if (errorKey && errorKey.startsWith('Rate Limited:')) {
		if (currentLang === 'zh') {
			const detail = errorKey.replace('Rate Limited:', '').trim();
			return '速率限制: ' + detail;
		} else {
			return errorKey;
		}
	}

	if (errorKey && errorKey.includes('HTTP ')) {
		return errorKey;
	}

	if (errorKey && errorKey.includes('(') && errorKey.includes(')')) {
		const match = errorKey.match(/^(.+?)\s*\((\d{3})\)$/);
		if (match) {
			const errorText = match[1];
			const statusCode = match[2];
			const errorTextMap = {
				'API密钥无效': currentLang === 'zh' ? 'API密钥无效' : 'Invalid API Key',
				'认证失败': currentLang === 'zh' ? '认证失败' : 'Auth Failed',
				'权限不足': currentLang === 'zh' ? '权限不足' : 'Permission Denied',
				'请求过多': currentLang === 'zh' ? '请求过多' : 'Too Many Requests'
			};
			const translatedText = errorTextMap[errorText] || errorText;
			return `${translatedText} (${statusCode})`;
		}
	}

	return errorKey || (currentLang === 'zh' ? '未知错误' : 'Unknown Error');
}

try {
	if (typeof window !== 'undefined') {
		window.toggleLanguage = toggleLanguage;
		window.updateLanguage = updateLanguage;
		window.getLocalizedError = getLocalizedError;
	}
} catch (_) {}


