function copyKeys(type) {
	let keysToCopy = [];
	switch (type) {
		case 'all':
			keysToCopy = allKeysData.map(k => k.key); break;
		case 'valid':
			keysToCopy = allKeysData.filter(k => k.status === 'valid').map(k => k.key); break;
		case 'invalid':
			keysToCopy = allKeysData.filter(k => k.status === 'invalid').map(k => k.key); break;
		case 'rate-limited':
			keysToCopy = allKeysData.filter(k => k.status === 'rate-limited').map(k => k.key); break;
		case 'paid':
			keysToCopy = allKeysData.filter(k => k.status === 'paid').map(k => k.key); break;
	}
	if (keysToCopy.length === 0) {
		const message = currentLang === 'zh' ? '没有可复制的密钥！' : 'No keys to copy!';
		alert(message);
		return;
	}
	return navigator.clipboard.writeText(keysToCopy.join('\n')).then(() => {
		const message = currentLang === 'zh' ? `已复制 ${keysToCopy.length} 个密钥到剪贴板！` : `Copied ${keysToCopy.length} keys to clipboard!`;
		alert(message);
	}).catch(() => {
		const textArea = document.createElement('textarea');
		textArea.value = keysToCopy.join('\n');
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand('copy');
		document.body.removeChild(textArea);
		const message = currentLang === 'zh' ? `已复制 ${keysToCopy.length} 个密钥到剪贴板！` : `Copied ${keysToCopy.length} keys to clipboard!`;
		alert(message);
	});
}

function pasteFromClipboard() {
	return navigator.clipboard.readText().then(text => {
		const apiKeysTextarea = document.getElementById('apiKeys');
		const currentValue = apiKeysTextarea.value;
		apiKeysTextarea.value = currentValue.trim() ? currentValue + '\n' + text : text;
		apiKeysTextarea.dispatchEvent(new Event('input'));
	}).catch(() => {
		alert(currentLang === 'zh' ? '无法读取剪贴板内容，请确保已授权访问剪贴板' : 'Cannot read clipboard content, please ensure clipboard access is authorized');
	});
}

function importFile() {
	document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
	const file = event.target.files[0];
	if (!file) return;
	const fileName = file.name.toLowerCase();
	const isTextFile = fileName.endsWith('.txt') || file.type === 'text/plain' || file.type === '';
	if (!isTextFile) {
		alert(currentLang === 'zh' ? '请选择一个.txt文件' : 'Please select a .txt file');
		event.target.value = '';
		return;
	}
	const maxSize = 10 * 1024 * 1024;
	if (file.size > maxSize) {
		alert(currentLang === 'zh' ? '文件过大，请选择小于10MB的文件' : 'File too large, please select a file smaller than 10MB');
		event.target.value = '';
		return;
	}
	const importBtn = document.getElementById('importBtn');
	const originalText = importBtn.textContent;
	importBtn.textContent = currentLang === 'zh' ? '导入中...' : 'Importing...';
	importBtn.disabled = true;
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const content = e.target.result;
			const extractedKeys = extractApiKeys(content);
			const apiKeysTextarea = document.getElementById('apiKeys');
			const currentValue = apiKeysTextarea.value;
			apiKeysTextarea.value = currentValue.trim() ? currentValue + '\n' + extractedKeys.join('\n') : extractedKeys.join('\n');
			apiKeysTextarea.dispatchEvent(new Event('input'));
			const message = currentLang === 'zh' ? `成功导入 ${extractedKeys.length} 个API密钥` : `Successfully imported ${extractedKeys.length} API keys`;
			alert(message);
		} catch (error) {
			alert(currentLang === 'zh' ? '文件读取失败，请检查文件格式' : 'File reading failed, please check file format');
		} finally {
			importBtn.textContent = originalText;
			importBtn.disabled = false;
		}
	};
	reader.onerror = function() {
		alert(currentLang === 'zh' ? '文件读取失败' : 'File reading failed');
		importBtn.textContent = originalText;
		importBtn.disabled = false;
	};
	reader.readAsText(file, 'UTF-8');
	event.target.value = '';
}

try {
	if (typeof window !== 'undefined') {
		window.copyKeys = copyKeys;
		window.pasteFromClipboard = pasteFromClipboard;
		window.importFile = importFile;
		window.handleFileSelect = handleFileSelect;
	}
} catch (_) {}


