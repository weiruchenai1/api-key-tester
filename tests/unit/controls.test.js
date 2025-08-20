import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ui/controls', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<input id="concurrencyInput" value="7" />
			<input id="concurrencySlider" type="range" />
			<span id="sliderValue"></span>
			<button class="preset-btn" data-concurrency="1"></button>
			<button class="preset-btn" data-concurrency="7"></button>
			<button class="preset-btn" data-concurrency="10"></button>
			<input id="retryInput" value="4" />
			<input id="retrySlider" type="range" />
			<span id="retrySliderValue"></span>
			<button class="retry-preset-btn" data-retry="0"></button>
			<button class="retry-preset-btn" data-retry="4"></button>
			<button class="retry-preset-btn" data-retry="7"></button>
		`;
		window.currentConcurrency = 7;
		window.currentRetryCount = 4;
		window.currentLang = 'zh';
		window.alert = vi.fn();
	});

	it('初始化时用当前值同步 UI', async () => {
		await import('../../js/ui/controls.js');
		const { initConcurrencyControls, initRetryControls } = window;
		initConcurrencyControls();
		initRetryControls();
		expect(document.getElementById('concurrencyInput').value).toBe('7');
		expect(document.getElementById('concurrencySlider').value).toBe('7');
		expect(document.getElementById('sliderValue').textContent).toBe('7');
		expect(document.querySelector('.preset-btn[data-concurrency="7"]').classList.contains('active')).toBe(true);
		expect(document.getElementById('retryInput').value).toBe('4');
		expect(document.getElementById('retrySlider').value).toBe('4');
		expect(document.getElementById('retrySliderValue').textContent).toBe('4');
		expect(document.querySelector('.retry-preset-btn[data-retry="4"]').classList.contains('active')).toBe(true);
	});

	it('滑杆驱动联动', async () => {
		await import('../../js/ui/controls.js');
		const { initConcurrencyControls, initRetryControls } = window;
		initConcurrencyControls();
		initRetryControls();
		const cSlider = document.getElementById('concurrencySlider');
		cSlider.value = '10';
		cSlider.dispatchEvent(new Event('input'));
		expect(document.getElementById('concurrencyInput').value).toBe('10');
		expect(document.getElementById('sliderValue').textContent).toBe('10');
		expect(document.querySelector('.preset-btn[data-concurrency="10"]').classList.contains('active')).toBe(true);
		const rSlider = document.getElementById('retrySlider');
		rSlider.value = '7';
		rSlider.dispatchEvent(new Event('input'));
		expect(document.getElementById('retryInput').value).toBe('7');
		expect(document.getElementById('retrySliderValue').textContent).toBe('7');
		expect(document.querySelector('.retry-preset-btn[data-retry="7"]').classList.contains('active')).toBe(true);
	});

	it('输入框驱动联动与边界值', async () => {
		await import('../../js/ui/controls.js');
		const { initConcurrencyControls, initRetryControls } = window;
		initConcurrencyControls();
		initRetryControls();
		const cInput = document.getElementById('concurrencyInput');
		cInput.value = '0';
		cInput.dispatchEvent(new Event('input'));
		expect(document.getElementById('concurrencyInput').value).toBe('1');
		const rInput = document.getElementById('retryInput');
		rInput.value = '20';
		rInput.dispatchEvent(new Event('input'));
		expect(document.getElementById('retryInput').value).toBe('10');
	});

	it('预设按钮驱动联动', async () => {
		await import('../../js/ui/controls.js');
		const { initConcurrencyControls, initRetryControls } = window;
		initConcurrencyControls();
		initRetryControls();
		document.querySelector('.preset-btn[data-concurrency="1"]').click();
		expect(document.getElementById('sliderValue').textContent).toBe('1');
		document.querySelector('.retry-preset-btn[data-retry="0"]').click();
		expect(document.getElementById('retrySliderValue').textContent).toBe('0');
	});

	it('未输入 apikey 时按钮提示：中文/英文', async () => {
		const startBtn = document.createElement('button');
		startBtn.id = 'startBtn';
		document.body.appendChild(startBtn);
		const dedupeBtn = document.createElement('button');
		dedupeBtn.id = 'dedupeBtn';
		document.body.appendChild(dedupeBtn);
		const clearBtn = document.createElement('button');
		clearBtn.id = 'clearBtn';
		document.body.appendChild(clearBtn);
		const apiKeys = document.createElement('textarea');
		apiKeys.id = 'apiKeys';
		document.body.appendChild(apiKeys);
		await import('../../js/ui/controls.js');
		// 触发模块中的 DOMContentLoaded 绑定（在 jsdom 下可能保持 loading 状态）
		document.dispatchEvent(new Event('DOMContentLoaded'));
		// 触发安全初始化绑定（幂等保障）
		window.initConcurrencyControls();
		window.initRetryControls();
		// 中文
		window.currentLang = 'zh';
		startBtn.click();
		expect(window.alert).toHaveBeenCalledWith('请先输入api密匙！');
		// 英文
		window.alert.mockClear();
		window.currentLang = 'en';
		startBtn.click();
		expect(window.alert).toHaveBeenCalledWith('Please enter API keys first!');
		// 去重按钮
		window.alert.mockClear();
		window.currentLang = 'zh';
		dedupeBtn.click();
		expect(window.alert).toHaveBeenCalled();
	});
});


