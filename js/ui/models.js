function updateModelOptions() {
	const apiType = document.getElementById('apiType').value;
	const modelSelect = document.getElementById('modelSelect');
	const options = modelOptions[apiType];
	modelSelect.innerHTML = '';
	options.forEach(model => {
		const optionElement = document.createElement('option');
		optionElement.value = model;
		optionElement.textContent = model;
		modelSelect.appendChild(optionElement);
	});
}

function toggleModelInput() {
	isCustomModel = !isCustomModel;
	const modelSelect = document.getElementById('modelSelect');
	const modelInput = document.getElementById('modelInput');
	const toggleBtn = document.getElementById('modelToggleBtn');
	if (isCustomModel) {
		modelSelect.classList.add('hidden');
		modelInput.classList.remove('hidden');
		toggleBtn.textContent = translations[currentLang]['preset-model'];
		toggleBtn.classList.add('active');
	} else {
		modelSelect.classList.remove('hidden');
		modelInput.classList.add('hidden');
		toggleBtn.textContent = translations[currentLang]['custom-model'];
		toggleBtn.classList.remove('active');
	}
}

function getSelectedModel() {
	if (isCustomModel) {
		return document.getElementById('modelInput').value.trim();
	} else {
		return document.getElementById('modelSelect').value;
	}
}

function addDetectedModel(model) {
	if (!detectedModels.has(model)) {
		detectedModels.add(model);
		updateDetectedModelsList();
	}
}

function updateDetectedModelsList() {
	const modelList = document.getElementById('modelList');
	const detectedModelsDiv = document.getElementById('detectedModels');
	const modelCountSpan = document.querySelector('#detectedModelsHeader h4');
	if (detectedModels.size > 0) {
		detectedModelsDiv.style.display = 'block';
		const titleKey = 'detected-models-title';
		const baseTitle = translations[currentLang][titleKey];
		modelCountSpan.textContent = `${baseTitle} (${detectedModels.size})`;
		modelList.innerHTML = '';
		detectedModels.forEach(model => {
			const modelTag = document.createElement('div');
			modelTag.className = 'model-tag';
			modelTag.textContent = model;
			modelTag.onclick = () => selectDetectedModel(model);
			modelList.appendChild(modelTag);
		});
	} else {
		detectedModelsDiv.style.display = 'none';
	}
}

function toggleModelList() {
	const container = document.getElementById('modelListContainer');
	const icon = document.getElementById('collapseIcon');
	if (container.classList.contains('expanded')) {
		container.classList.remove('expanded');
		icon.classList.add('collapsed');
	} else {
		container.classList.add('expanded');
		icon.classList.remove('collapsed');
	}
}

function selectDetectedModel(model) {
	if (isCustomModel) {
		document.getElementById('modelInput').value = model;
	} else {
		const modelSelect = document.getElementById('modelSelect');
		let optionExists = false;
		for (let option of modelSelect.options) {
			if (option.value === model) {
				modelSelect.value = model;
				optionExists = true;
				break;
			}
		}
		if (!optionExists) {
			const newOption = document.createElement('option');
			newOption.value = model;
			newOption.textContent = model;
			modelSelect.appendChild(newOption);
			modelSelect.value = model;
		}
	}
}

async function detectModels() {
	const apiType = document.getElementById('apiType').value;
	const apiKeysText = document.getElementById('apiKeys').value.trim();
	if (!apiKeysText) {
		alert(currentLang === 'zh' ? '请先输入API密钥！' : 'Please enter API keys first!');
		return;
	}
	const apiKeys = apiKeysText.split('\n').filter(key => key.trim());
	if (apiKeys.length === 0) {
		alert(currentLang === 'zh' ? '请输入有效的API密钥！' : 'Please enter valid API keys!');
		return;
	}
	const testKey = apiKeys[0].trim();
	document.getElementById('loading').classList.remove('hidden');
	const loadingText = document.querySelector('#loading p');
	loadingText.textContent = translations[currentLang]['detecting'];
	detectedModels.clear();
	try {
		const models = await getAvailableModels(testKey, apiType);
		if (models && models.length > 0) {
			models.forEach(model => addDetectedModel(model));
			alert(currentLang === 'zh' ? `检测到 ${models.length} 个可用模型` : `Detected ${models.length} available models`);
		} else {
			alert(currentLang === 'zh' ? '未检测到可用模型。请检查：\n• API密钥是否有效\n• 代理设置是否正确\n• 网络连接是否正常' : 'No available models detected. Please check:\n• API key validity\n• Proxy settings\n• Network connection');
		}
	} catch (error) {
		alert(currentLang === 'zh' ? '未检测到可用模型。请检查：\n• API密钥是否有效\n• 代理设置是否正确\n• 网络连接是否正常' : 'No available models detected. Please check:\n• API key validity\n• Proxy settings\n• Network connection');
	} finally {
		document.getElementById('loading').classList.add('hidden');
		loadingText.textContent = translations[currentLang]['testing'];
	}
}

try {
	if (typeof window !== 'undefined') {
		window.updateModelOptions = updateModelOptions;
		window.toggleModelInput = toggleModelInput;
		window.getSelectedModel = getSelectedModel;
		window.addDetectedModel = addDetectedModel;
		window.updateDetectedModelsList = updateDetectedModelsList;
		window.toggleModelList = toggleModelList;
		window.selectDetectedModel = selectDetectedModel;
		window.detectModels = detectModels;
	}
} catch (_) {}


