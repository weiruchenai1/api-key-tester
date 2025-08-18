function initializeEventListeners() {
	document.getElementById('langBtn').addEventListener('click', toggleLanguage);
	document.getElementById('themeBtn').addEventListener('click', toggleTheme);
	document.getElementById('apiType').addEventListener('change', updateProxyPlaceholder);
	document.getElementById('modelToggleBtn').addEventListener('click', toggleModelInput);
	document.getElementById('detectedModelsHeader').addEventListener('click', toggleModelList);
	document.getElementById('detectBtn').addEventListener('click', detectModels);
	document.getElementById('startBtn').addEventListener('click', startTesting);
	document.getElementById('dedupeBtn').addEventListener('click', deduplicateKeys);
	document.getElementById('clearBtn').addEventListener('click', clearAll);
	document.getElementById('pasteBtn').addEventListener('click', pasteFromClipboard);
	document.getElementById('importBtn').addEventListener('click', importFile);
	document.getElementById('fileInput').addEventListener('change', handleFileSelect);
	document.querySelectorAll('[data-tab]').forEach(tab => {
		tab.addEventListener('click', (e) => {
			showTab(e.target.getAttribute('data-tab'));
		});
	});
	document.querySelectorAll('[data-copy]').forEach(btn => {
		btn.addEventListener('click', (e) => {
			copyKeys(e.target.getAttribute('data-copy'));
		});
	});
}

function handleResize() {
	if (window.innerWidth <= 768) {
		const keyLists = document.querySelectorAll('.key-list');
		keyLists.forEach(list => {
			const maxHeight = Math.min(300, window.innerHeight * 0.4);
			list.style.maxHeight = maxHeight + 'px';
		});
	}
}

function initialize() {
	updateProxyPlaceholder();
	updateLanguage();
	initializeEventListeners();
	initConcurrencyControls();
	initRetryControls();
	window.addEventListener('resize', handleResize);
	window.addEventListener('orientationchange', () => { setTimeout(handleResize, 100); });
	handleResize();
}

try {
	if (typeof window !== 'undefined') {
		window.initializeEventListeners = initializeEventListeners;
		window.handleResize = handleResize;
		window.initialize = initialize;
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', initialize);
		} else {
			initialize();
		}
	}
} catch (_) {}


