function finalizeResult(keyData, result, retryCount) {
	if (keyData) {
		keyData.retryCount = retryCount;
		keyData.error = result.error;
		if (result.valid) {
			if (keyData && keyData.type === 'gemini' && result.isPaid) {
				keyData.status = 'paid';
			} else {
				keyData.status = 'valid';
			}
		} else if (result.isRateLimit) {
			keyData.status = 'rate-limited';
		} else {
			keyData.status = 'invalid';
		}
	}
	return result;
}

async function startTesting() {
	if (isTestingInProgress) {
		shouldCancelTesting = true;
		return;
	}

	const apiType = document.getElementById('apiType').value;
	const apiKeysText = document.getElementById('apiKeys').value.trim();
	const selectedModel = getSelectedModel();

	// 空输入由 UI 层按钮绑定统一弹窗，这里静默返回避免重复提示
	if (!apiKeysText) return;
	if (!selectedModel) {
		alert(currentLang === 'zh' ? '请选择或输入模型名！' : 'Please select or enter model name!');
		return;
	}

	const rawKeys = apiKeysText.split('\n').filter(key => key.trim());
	// 无有效 key 时静默返回，避免与 UI 层重复提示
	if (rawKeys.length === 0) return;

	const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);
	if (duplicates.length > 0) {
		const message = currentLang === 'zh'
			? `发现 ${duplicates.length} 个重复密钥，已自动去除。将测试 ${uniqueKeys.length} 个唯一密钥。`
			: `Found ${duplicates.length} duplicate keys, automatically removed. Will test ${uniqueKeys.length} unique keys.`;
		alert(message);
	}

	isTestingInProgress = true;
	shouldCancelTesting = false;
	completedCount = 0;
	totalCount = uniqueKeys.length;

	if (typeof updateStartButtonText === 'function') updateStartButtonText();

	allKeysData = [];
	uniqueKeys.forEach(apiKey => {
		const keyData = {
			key: apiKey,
			status: 'pending',
			error: null,
			type: apiType,
			model: selectedModel,
			retryCount: 0
		};
		allKeysData.push(keyData);
	});

	document.getElementById('loading').classList.remove('hidden');
	document.getElementById('progressBar').classList.remove('hidden');
	document.getElementById('resultsSection').classList.remove('hidden');

	if (typeof updateStats === 'function') updateStats();
	if (typeof updateKeyLists === 'function') updateKeyLists();

	try {
		await processWithFixedConcurrency(uniqueKeys, apiType);
	} catch (error) {
		// ignore and proceed finally
	} finally {
		isTestingInProgress = false;
		shouldCancelTesting = false;
		document.getElementById('loading').classList.add('hidden');
		document.getElementById('progressBar').classList.add('hidden');
		if (typeof updateStartButtonText === 'function') updateStartButtonText();
		if (typeof updateStats === 'function') updateStats();
		if (typeof updateKeyLists === 'function') updateKeyLists();
		if (!shouldCancelTesting && typeof showCompletionMessage === 'function') {
			showCompletionMessage();
		}
	}
}

try {
	if (typeof window !== 'undefined') {
		window.startTesting = startTesting;
		window.finalizeResult = finalizeResult;
	}
} catch (_) {}


