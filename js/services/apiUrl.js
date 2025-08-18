function getApiUrl(apiType, endpoint) {
	const proxyUrl = document.getElementById('proxyUrl').value.trim();

	if (proxyUrl) {
		const baseUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
		return baseUrl + endpoint;
	} else {
		switch (apiType) {
			case 'openai':
				return 'https://openai.weiruchenai.me/v1' + endpoint;
			case 'claude':
				return 'https://claude.weiruchenai.me/v1' + endpoint;
			case 'gemini':
				return 'https://gemini.weiruchenai.me/v1beta' + endpoint;
		}
	}
}

function updateProxyPlaceholder() {
	const apiType = document.getElementById('apiType').value;
	const proxyInput = document.getElementById('proxyUrl');

	switch (apiType) {
		case 'openai':
			proxyInput.placeholder = 'https://openai.weiruchenai.me/v1';
			break;
		case 'claude':
			proxyInput.placeholder = 'https://claude.weiruchenai.me/v1';
			break;
		case 'gemini':
			proxyInput.placeholder = 'https://gemini.weiruchenai.me/v1beta';
			break;
	}

	// 依赖页面中定义的 updateModelOptions，在初始化阶段调用
	if (typeof updateModelOptions === 'function') {
		updateModelOptions();
	}
}

// 兼容模块与非模块脚本：将方法暴露到 window，方便测试与运行时调用
try {
	if (typeof window !== 'undefined') {
		window.getApiUrl = getApiUrl;
		window.updateProxyPlaceholder = updateProxyPlaceholder;
	}
} catch (_) {}


