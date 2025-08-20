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
		
		// 标记完成时间，用于内存管理
		if (typeof memoryManager !== 'undefined' && memoryManager.markKeyCompleted) {
			memoryManager.markKeyCompleted(keyData);
		}
	}
	return result;
}

function cancelTesting() {
	if (isTestingInProgress) {
		shouldCancelTesting = true;
		console.log('User requested to cancel testing');
	}
}

async function startTesting() {
	if (isTestingInProgress) {
		// 正在测试中时的重入：忽略额外的开始请求，避免误触导致取消
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

	// 清空现有数据
	allKeysData = [];
	
	// 检查是否需要性能优化
	if (uniqueKeys.length > 1000 && typeof initializeKeysProgressively === 'function') {
		// 大量密钥时使用渐进式初始化
		console.log(`[Performance] 大量密钥检测到 (${uniqueKeys.length})，启用性能优化模式`);
		await initializeKeysProgressively(uniqueKeys, apiType, selectedModel);
	} else {
		// 少量密钥时使用传统方式
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
	}

	document.getElementById('loading').classList.remove('hidden');
	document.getElementById('progressBar').classList.remove('hidden');
	document.getElementById('resultsSection').classList.remove('hidden');

	// 使用优化的UI更新
	if (typeof updateUIProgressively === 'function') {
		await updateUIProgressively();
	} else {
		if (typeof updateStats === 'function') updateStats();
		if (typeof updateKeyLists === 'function') updateKeyLists();
	}
	// 初始化进度条到 0%
	if (typeof updateProgress === 'function') updateProgress();

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
		
		// 使用优化的UI更新
		if (typeof updateUIProgressively === 'function') {
			await updateUIProgressively();
		} else {
			if (typeof updateStats === 'function') updateStats();
			if (typeof updateKeyLists === 'function') updateKeyLists();
		}
		if (!shouldCancelTesting && typeof showCompletionMessage === 'function') {
			showCompletionMessage();
		}
	}
}

try {
	if (typeof window !== 'undefined') {
		window.startTesting = startTesting;
		window.cancelTesting = cancelTesting;
		window.finalizeResult = finalizeResult;
	}
} catch (_) {}


