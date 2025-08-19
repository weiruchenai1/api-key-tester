import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('utils/clipboard', () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<textarea id="apiKeys"></textarea>
			<button id="importBtn">导入</button>
			<input id="fileInput" type="file" />
		`;
		window.currentLang = 'zh';
		window.allKeysData = [
			{ key: 'k-valid', status: 'valid' },
			{ key: 'k-invalid', status: 'invalid' },
			{ key: 'k-rate', status: 'rate-limited' },
			{ key: 'k-paid', status: 'paid' }
		];
		vi.stubGlobal('alert', vi.fn());
	});

	it('copyKeys 正常复制与回退', async () => {
		await import('../../js/utils/clipboard.js');
		const { copyKeys } = window;
		const writeText = vi.fn().mockResolvedValueOnce();
		Object.assign(navigator, { clipboard: { writeText } });
		await copyKeys('all');
		expect(writeText).toHaveBeenCalledWith('k-valid\nk-invalid\nk-rate\nk-paid');
		// fallback
		const writeFail = vi.fn().mockRejectedValueOnce(new Error('fail'));
		Object.assign(navigator, { clipboard: { writeText: writeFail } });
		document.execCommand = vi.fn().mockReturnValue(true);
		await copyKeys('valid');
		expect(document.execCommand).toHaveBeenCalledWith('copy');
	});

	it('copyKeys 分支覆盖：invalid、rate-limited、空集提示', async () => {
		await import('../../js/utils/clipboard.js');
		const { copyKeys } = window;
		const writeText = vi.fn().mockResolvedValue();
		Object.assign(navigator, { clipboard: { writeText } });
		// invalid
		await copyKeys('invalid');
		expect(writeText).toHaveBeenCalledWith('k-invalid');
		// rate-limited
		await copyKeys('rate-limited');
		expect(writeText).toHaveBeenCalledWith('k-rate');
		// paid
		await copyKeys('paid');
		expect(writeText).toHaveBeenCalledWith('k-paid');
		// 空集 -> 提示
		writeText.mockClear();
		window.allKeysData = [];
		await copyKeys('valid');
		expect(writeText).not.toHaveBeenCalled();
		expect(window.alert).toHaveBeenCalled();
	});

	it('pasteFromClipboard 追加/触发input事件', async () => {
		await import('../../js/utils/clipboard.js');
		const { pasteFromClipboard } = window;
		const readText = vi.fn().mockResolvedValueOnce('A')
			.mockResolvedValueOnce('B');
		Object.assign(navigator, { clipboard: { readText } });
		const ta = document.getElementById('apiKeys');
		let fired = 0;
		ta.addEventListener('input', () => fired++);
		await pasteFromClipboard();
		expect(ta.value).toBe('A');
		await pasteFromClipboard();
		expect(ta.value).toBe('A\nB');
		expect(fired).toBe(2);
	});

	it('pasteFromClipboard 失败路径触发提示', async () => {
		await import('../../js/utils/clipboard.js');
		const { pasteFromClipboard } = window;
		const readText = vi.fn().mockRejectedValueOnce(new Error('deny'));
		Object.assign(navigator, { clipboard: { readText } });
		await pasteFromClipboard();
		expect(window.alert).toHaveBeenCalled();
	});

	it('importFile 触发点击', async () => {
		await import('../../js/utils/clipboard.js');
		const { importFile } = window;
		const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		importFile();
		expect(click).toHaveBeenCalled();
		click.mockRestore();
	});

	it('handleFileSelect 读取并填充', async () => {
		await import('../../js/utils/clipboard.js');
		await import('../../js/utils/keys.js');
		const { handleFileSelect } = window;
		const file = new Blob(['sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234']);
		file.name = 'a.txt';
		const evt = { target: { files: [file], value: '' } };
		// mock FileReader
		const onloadHandlers = {};
		vi.stubGlobal('FileReader', function() {
			this.readAsText = () => {
				onloadHandlers.load({ target: { result: 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234' } });
			};
			Object.defineProperty(this, 'onload', {
				set(v) { onloadHandlers.load = v; }
			});
			Object.defineProperty(this, 'onerror', {
				set(v) { onloadHandlers.error = v; }
			});
		});
		handleFileSelect(evt);
		expect(document.getElementById('apiKeys').value.includes('sk-')).toBe(true);
	});

	it('handleFileSelect 非文本类型/超大文件 早返回与提示', async () => {
		await import('../../js/utils/clipboard.js');
		const { handleFileSelect } = window;
		// 非文本类型
		const evt1 = { target: { files: [{ name: 'a.json', type: 'application/json', size: 10 }], value: 'x' } };
		handleFileSelect(evt1);
		expect(evt1.target.value).toBe('');
		expect(window.alert).toHaveBeenCalled();
		// 超大文件
		const evt2 = { target: { files: [{ name: 'a.txt', type: 'text/plain', size: 15 * 1024 * 1024 }], value: 'y' } };
		handleFileSelect(evt2);
		expect(evt2.target.value).toBe('');
		expect(window.alert).toHaveBeenCalled();
	});

	it('handleFileSelect onload 中提取抛错 -> 捕获与恢复按钮', async () => {
		await import('../../js/utils/clipboard.js');
		window.extractApiKeys = vi.fn(() => { throw new Error('bad'); });
		const { handleFileSelect } = window;
		const file = new Blob(['foo']);
		file.name = 'a.txt';
		const evt = { target: { files: [file], value: '' } };
		const on = {};
		vi.stubGlobal('FileReader', function() {
			this.readAsText = () => { on.load({ target: { result: 'blah' } }); };
			Object.defineProperty(this, 'onload', { set(v) { on.load = v; } });
			Object.defineProperty(this, 'onerror', { set(v) { on.error = v; } });
		});
		handleFileSelect(evt);
		expect(window.alert).toHaveBeenCalled();
	});

	it('handleFileSelect reader.onerror 路径', async () => {
		await import('../../js/utils/clipboard.js');
		const { handleFileSelect } = window;
		const file = new Blob(['foo']);
		file.name = 'a.txt';
		const evt = { target: { files: [file], value: '' } };
		const on = {};
		vi.stubGlobal('FileReader', function() {
			this.readAsText = () => { on.error(); };
			Object.defineProperty(this, 'onload', { set(v) { on.load = v; } });
			Object.defineProperty(this, 'onerror', { set(v) { on.error = v; } });
		});
		handleFileSelect(evt);
		expect(window.alert).toHaveBeenCalled();
	});
});


