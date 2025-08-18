async function processWithFixedConcurrency(apiKeys, apiType) {
	const keyQueue = [...apiKeys];
	const activeSlots = new Array(currentConcurrency).fill(null);
	let nextKeyIndex = 0;

	for (let i = 0; i < currentConcurrency && i < keyQueue.length; i++) {
		activeSlots[i] = startKeyTest(keyQueue[nextKeyIndex], apiType, i);
		nextKeyIndex++;
	}

	while (activeSlots.some(slot => slot !== null) && !shouldCancelTesting) {
		const completedIndex = await waitForAnySlotCompletion(activeSlots);
		completedCount++;
		updateProgress();
		if (shouldCancelTesting) {
			break;
		}
		if (nextKeyIndex < keyQueue.length) {
			activeSlots[completedIndex] = startKeyTest(keyQueue[nextKeyIndex], apiType, completedIndex);
			nextKeyIndex++;
		} else {
			activeSlots[completedIndex] = null;
		}
	}
}

async function startKeyTest(apiKey, apiType, slotIndex) {
	try {
		const result = await testApiKeyWithRetry(apiKey, apiType, currentRetryCount);
		return result;
	} catch (error) {
		const keyData = allKeysData.find(k => k.key === apiKey);
		if (keyData) {
			keyData.status = 'invalid';
			keyData.error = '测试异常: ' + error.message;
		}
		return { valid: false, error: error.message, isRateLimit: false };
	} finally {
		if (typeof updateUIAsync === 'function') updateUIAsync();
	}
}

async function waitForAnySlotCompletion(activeSlots) {
	const activePromises = activeSlots
		.map((promise, index) => (promise ? promise.then(() => index) : null))
		.filter(p => p !== null);
	if (activePromises.length === 0) {
		throw new Error('没有活跃的测试任务');
	}
	return await Promise.race(activePromises);
}

function updateProgress() {
	const progress = (completedCount / totalCount) * 100;
	document.getElementById('progressFill').style.width = progress + '%';
}

try {
	if (typeof window !== 'undefined') {
		window.processWithFixedConcurrency = processWithFixedConcurrency;
		window.startKeyTest = startKeyTest;
		window.waitForAnySlotCompletion = waitForAnySlotCompletion;
		window.updateProgress = updateProgress;
	}
} catch (_) {}


