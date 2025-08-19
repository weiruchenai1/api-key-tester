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

	// Gemini 专用元素控制
	const geminiOnlyElements = document.querySelectorAll('.gemini-only');

	switch (apiType) {
		case 'openai':
			proxyInput.placeholder = 'https://openai.weiruchenai.me/v1';
			geminiOnlyElements.forEach(el => el.classList.add('hidden'));
			break;
		case 'claude':
			proxyInput.placeholder = 'https://claude.weiruchenai.me/v1';
			geminiOnlyElements.forEach(el => el.classList.add('hidden'));
			break;
		case 'gemini':
			proxyInput.placeholder = 'https://gemini.weiruchenai.me/v1beta';
			geminiOnlyElements.forEach(el => el.classList.remove('hidden'));
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


