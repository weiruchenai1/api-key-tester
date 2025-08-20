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

	// 付费检测可用性提示：仅在 Gemini 下检查一次
	try {
		const apiTypeSelect = document.getElementById('apiType');
		const tipEl = document.querySelector('[data-lang-key="paid-detection-tip"]');
		const ensureNotice = () => {
			if (!apiTypeSelect || !tipEl) return;
			const isGemini = apiTypeSelect.value === 'gemini';
			const paidOn = typeof featureFlags !== 'undefined' && !!featureFlags.paidDetection;
			const hasFn = typeof window.testGeminiContextCaching === 'function';
			let notice = document.querySelector('[data-lang-key="paid-detection-unavailable"]');
			if (!notice) {
				notice = document.createElement('div');
				notice.className = 'gemini-only hidden';
				notice.setAttribute('data-lang-key', 'paid-detection-unavailable');
				notice.textContent = translations[currentLang]['paid-detection-unavailable'] || 'Paid detection unavailable';
				tipEl.parentNode.insertBefore(notice, tipEl.nextSibling);
			}
			// 显示/隐藏
			if (isGemini && paidOn && !hasFn) {
				notice.classList.remove('hidden');
			} else {
				notice.classList.add('hidden');
			}
		};
		ensureNotice();
		apiTypeSelect && apiTypeSelect.addEventListener('change', () => setTimeout(ensureNotice, 0));
	} catch (_) {}
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


