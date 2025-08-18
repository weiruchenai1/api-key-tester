function updateRetryCount(value) {
	currentRetryCount = parseInt(value);
	document.getElementById('retryInput').value = currentRetryCount;
	document.getElementById('retrySlider').value = currentRetryCount;
	document.getElementById('retrySliderValue').textContent = currentRetryCount;
	document.querySelectorAll('.retry-preset-btn').forEach(btn => {
		btn.classList.remove('active');
		if (parseInt(btn.getAttribute('data-retry')) === currentRetryCount) {
			btn.classList.add('active');
		}
	});
}

function initRetryControls() {
	// 确保主按钮已绑定（即使控件已幂等绑定也要尝试）
	try { if (typeof window !== 'undefined' && typeof window.bindPrimaryButtons === 'function') window.bindPrimaryButtons(); } catch (_) {}
	const input = document.getElementById('retryInput');
	const slider = document.getElementById('retrySlider');
	const presetButtons = document.querySelectorAll('.retry-preset-btn');
	if (!input || !slider || presetButtons.length === 0) return;
	if (input.dataset.bound === '1') return; // idempotent
	input.addEventListener('input', (e) => {
		let value = parseInt(e.target.value);
		if (isNaN(value) || value < 0) value = 0;
		if (value > 10) value = 10;
		e.target.value = value;
		updateRetryCount(value);
	});
	slider.addEventListener('input', (e) => {
		updateRetryCount(e.target.value);
	});
	presetButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const value = parseInt(btn.getAttribute('data-retry'));
			updateRetryCount(value);
		});
	});
	input.dataset.bound = '1';
	updateRetryCount(currentRetryCount);
}

function updateConcurrency(value) {
	currentConcurrency = parseInt(value);
	document.getElementById('concurrencyInput').value = currentConcurrency;
	document.getElementById('concurrencySlider').value = Math.min(currentConcurrency, 50);
	document.getElementById('sliderValue').textContent = currentConcurrency;
	document.querySelectorAll('.preset-btn').forEach(btn => {
		btn.classList.remove('active');
		if (parseInt(btn.getAttribute('data-concurrency')) === currentConcurrency) {
			btn.classList.add('active');
		}
	});
}

function initConcurrencyControls() {
	// 确保主按钮已绑定（即使控件已幂等绑定也要尝试）
	try { if (typeof window !== 'undefined' && typeof window.bindPrimaryButtons === 'function') window.bindPrimaryButtons(); } catch (_) {}
	const input = document.getElementById('concurrencyInput');
	const slider = document.getElementById('concurrencySlider');
	const presetButtons = document.querySelectorAll('.preset-btn');
	if (!input || !slider || presetButtons.length === 0) return;
	if (input.dataset.bound === '1') return; // idempotent
	input.addEventListener('input', (e) => {
		let value = parseInt(e.target.value);
		if (isNaN(value) || value < 1) value = 1;
		e.target.value = value;
		updateConcurrency(value);
	});
	slider.addEventListener('input', (e) => {
		updateConcurrency(e.target.value);
	});
	presetButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const value = parseInt(btn.getAttribute('data-concurrency'));
			updateConcurrency(value);
		});
	});
	input.dataset.bound = '1';
	updateConcurrency(currentConcurrency);
}

function getCurrentLang() {
	try {
		if (typeof window !== 'undefined' && typeof window.currentLang !== 'undefined' && window.currentLang) {
			return window.currentLang;
		}
		// 顶层 let 定义不会挂到 window 上，这里兜底读取全局符号
		if (typeof currentLang !== 'undefined' && currentLang) {
			return currentLang;
		}
	} catch (_) {}
	return 'en';
}

function bindPrimaryButtons() {
	// Bind primary buttons defensively
	const apiTextarea = document.getElementById('apiKeys');
	const startBtn = document.getElementById('startBtn');
	const dedupeBtn = document.getElementById('dedupeBtn');
	const clearBtn = document.getElementById('clearBtn');
	if (dedupeBtn && !dedupeBtn.dataset.bound) {
		dedupeBtn.addEventListener('click', (e) => {
			if (apiTextarea && !apiTextarea.value.trim()) {
				window.alert(getCurrentLang() === 'zh' ? '请先输入api密匙！' : 'Please enter API keys first!');
				return;
			}
			if (typeof window.deduplicateKeys === 'function') window.deduplicateKeys();
		});
		dedupeBtn.dataset.bound = '1';
	}
	if (startBtn && !startBtn.dataset.bound) {
		startBtn.addEventListener('click', () => {
			if (apiTextarea && !apiTextarea.value.trim()) {
				window.alert(getCurrentLang() === 'zh' ? '请先输入api密匙！' : 'Please enter API keys first!');
				return;
			}
			if (typeof window.startTesting === 'function') window.startTesting();
		});
		startBtn.dataset.bound = '1';
	}
	if (clearBtn && !clearBtn.dataset.bound) {
		clearBtn.addEventListener('click', () => {
			if (typeof window.clearAll === 'function') window.clearAll();
		});
		clearBtn.dataset.bound = '1';
	}
}

function deduplicateKeys() {
	const apiKeysText = document.getElementById('apiKeys').value.trim();
	if (!apiKeysText) return; // 空输入由按钮绑定统一提示，函数内静默返回避免重复弹窗
	const rawKeys = apiKeysText.split('\n').filter(key => key.trim());
	const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);
	if (duplicates.length > 0) {
		document.getElementById('apiKeys').value = uniqueKeys.join('\n');
		const message = getCurrentLang() === 'zh'
			? `已去除 ${duplicates.length} 个重复密钥，保留 ${uniqueKeys.length} 个唯一密钥。`
			: `Removed ${duplicates.length} duplicate keys, kept ${uniqueKeys.length} unique keys.`;
		alert(message);
	} else {
		const message = getCurrentLang() === 'zh' ? '未发现重复密钥。' : 'No duplicate keys found.';
		alert(message);
	}
}

function clearAll() {
	if (isTestingInProgress) {
		const message = getCurrentLang() === 'zh' ? '测试正在进行中，无法清空！' : 'Testing in progress, cannot clear!';
		alert(message);
		return;
	}
	document.getElementById('apiKeys').value = '';
	document.getElementById('modelInput').value = '';
	document.getElementById('resultsSection').classList.add('hidden');
	document.getElementById('loading').classList.add('hidden');
	document.getElementById('progressBar').classList.add('hidden');
	document.getElementById('progressFill').style.width = '0%';
	document.getElementById('detectedModels').style.display = 'none';
	allKeysData = [];
	detectedModels.clear();
	completedCount = 0;
	totalCount = 0;
	try { updateStats(); } catch (_) {}
	try { updateKeyLists(); } catch (_) {}
	try { showTab('all'); } catch (_) {}
}

try {
	if (typeof window !== 'undefined') {
		window.updateRetryCount = updateRetryCount;
		window.initRetryControls = initRetryControls;
		window.updateConcurrency = updateConcurrency;
		window.initConcurrencyControls = initConcurrencyControls;
		window.bindPrimaryButtons = bindPrimaryButtons;
		window.deduplicateKeys = deduplicateKeys;
		window.clearAll = clearAll;
		const safeInit = () => {
			try { initConcurrencyControls(); } catch (_) {}
			try { initRetryControls(); } catch (_) {}
			bindPrimaryButtons();
		};
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', safeInit);
		} else {
			safeInit();
		}
	}
} catch (_) {}


