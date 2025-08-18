function updateStats() {
	const validKeys = allKeysData.filter(k => k.status === 'valid');
	const invalidKeys = allKeysData.filter(k => k.status === 'invalid');
	const rateLimitedKeys = allKeysData.filter(k => k.status === 'rate-limited');
	const testingKeys = allKeysData.filter(k => k.status === 'testing');
	const retryingKeys = allKeysData.filter(k => k.status === 'retrying');
	const pendingKeys = allKeysData.filter(k => k.status === 'pending');

	document.getElementById('totalCount').textContent = allKeysData.length;
	document.getElementById('validCount').textContent = validKeys.length;
	document.getElementById('invalidCount').textContent = invalidKeys.length;
	document.getElementById('rateLimitedCount').textContent = rateLimitedKeys.length;
	document.getElementById('testingCount').textContent = testingKeys.length + pendingKeys.length;
	document.getElementById('retryingCount').textContent = retryingKeys.length;
}

function updateKeyLists() {
	const validKeys = allKeysData.filter(k => k.status === 'valid');
	const invalidKeys = allKeysData.filter(k => k.status === 'invalid');
	const rateLimitedKeys = allKeysData.filter(k => k.status === 'rate-limited');
	updateKeyList('allKeys', allKeysData);
	updateKeyList('validKeys', validKeys);
	updateKeyList('invalidKeys', invalidKeys);
	updateKeyList('rateLimitedKeys', rateLimitedKeys);
}

function updateKeyList(elementId, keys) {
	const container = document.getElementById(elementId);
	if (!container) return;
	container.innerHTML = '';
	if (keys.length === 0) {
		const emptyState = document.createElement('div');
		emptyState.className = 'empty-state';
		let emptyMessage = '';
		switch (elementId) {
			case 'allKeys':
				emptyMessage = currentLang === 'zh' ? '暂无密钥' : 'No keys';
				break;
			case 'validKeys':
				emptyMessage = currentLang === 'zh' ? '暂无有效密钥' : 'No valid keys';
				break;
			case 'invalidKeys':
				emptyMessage = currentLang === 'zh' ? '暂无无效密钥' : 'No invalid keys';
				break;
			case 'rateLimitedKeys':
				emptyMessage = currentLang === 'zh' ? '暂无速率限制密钥' : 'No rate limited keys';
				break;
			default:
				emptyMessage = currentLang === 'zh' ? '暂无数据' : 'No data';
		}
		emptyState.innerHTML = '<div class="empty-icon">📭</div><div class="empty-text">' + emptyMessage + '</div>';
		container.appendChild(emptyState);
		return;
	}
	keys.forEach(keyData => {
		const keyItem = document.createElement('div');
		keyItem.className = 'key-item';
		const statusClass = keyData.status === 'valid' ? 'status-valid' :
			keyData.status === 'invalid' ? 'status-invalid' :
			keyData.status === 'rate-limited' ? 'status-rate-limited' :
			keyData.status === 'retrying' ? 'status-retrying' : 'status-testing';
		const statusText = translations[currentLang]['status-' + keyData.status] || keyData.status;
		let errorDisplay = '';
		if ((keyData.status === 'invalid' || keyData.status === 'rate-limited') && keyData.error) {
			const localizedError = getLocalizedError(keyData.error);
			const errorColor = keyData.status === 'rate-limited' ? '#856404' : '#dc3545';
			errorDisplay = '<div style="font-size: 11px; color: ' + errorColor + '; margin-top: 2px;">' + localizedError + '</div>';
		}
		let modelDisplay = '';
		if (keyData.model) {
			modelDisplay = '<div style="font-size: 11px; color: #6c757d; margin-top: 2px;">Model: ' + keyData.model + '</div>';
		}
		let retryDisplay = '';
		if (keyData.retryCount && keyData.retryCount > 0) {
			const retryText = currentLang === 'zh' ? '重试' : 'Retry';
			retryDisplay = '<div style="font-size: 11px; color: #f39c12; margin-top: 2px;">' + retryText + ': ' + keyData.retryCount + '</div>';
		}
		keyItem.innerHTML = '<div class="key-text">' + keyData.key + modelDisplay + errorDisplay + retryDisplay + '</div><div class="key-status ' + statusClass + '">' + statusText + '</div>';
		container.appendChild(keyItem);
	});
}

function showTab(tab) {
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
	const tabButton = document.querySelector(`[data-tab="${tab}"]`);
	let tabContentId = tab + 'Tab';
	if (tab === 'rate-limited') tabContentId = 'rateLimitedTab';
	const tabContent = document.getElementById(tabContentId);
	if (tabButton) tabButton.classList.add('active');
	if (tabContent) tabContent.classList.add('active');
}

function updateStartButtonText() {
	const startBtn = document.getElementById('startBtn');
	if (!startBtn) return;
	if (isTestingInProgress) {
		startBtn.textContent = translations[currentLang]['cancel-test'];
		startBtn.setAttribute('data-lang-key', 'cancel-test');
	} else {
		startBtn.textContent = translations[currentLang]['start-test'];
		startBtn.setAttribute('data-lang-key', 'start-test');
	}
}

function updateUIAsync() {
	if (updateTimer) return;
	updateTimer = setTimeout(() => {
		try { updateStats(); } catch (_) {}
		try { updateKeyLists(); } catch (_) {}
		updateTimer = null;
	}, 50);
}

try {
	if (typeof window !== 'undefined') {
		window.updateStats = updateStats;
		window.updateKeyLists = updateKeyLists;
		window.updateKeyList = updateKeyList;
		window.showTab = showTab;
		window.updateStartButtonText = updateStartButtonText;
		window.updateUIAsync = updateUIAsync;
	}
} catch (_) {}


