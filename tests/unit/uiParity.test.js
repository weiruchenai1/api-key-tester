import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

function loadDom(htmlPath) {
	const html = readFileSync(resolve(htmlPath), 'utf-8');
	return new JSDOM(html);
}

function collectIds(document) {
	const result = new Set();
	document.querySelectorAll('[id]').forEach((el) => result.add(el.id));
	return result;
}

function collectLangKeys(document) {
	const result = new Set();
	document.querySelectorAll('[data-lang-key]').forEach((el) => {
		const v = el.getAttribute('data-lang-key');
		if (v) result.add(v);
	});
	return result;
}

function collectValues(document, selector, attr) {
	return new Set(
		Array.from(document.querySelectorAll(selector))
			.map((el) => el.getAttribute(attr))
			.filter(Boolean)
	);
}

function getApiTypeOptions(document) {
	return new Set(
		Array.from(document.querySelectorAll('#apiType option'))
			.map((o) => o.value)
	);
}

function getLinks(document) {
	return new Set(
		Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
			.map((l) => l.getAttribute('href'))
	);
}

function getScripts(document) {
	return new Set(
		Array.from(document.querySelectorAll('script[src]'))
			.map((s) => s.getAttribute('src'))
	);
}

describe('UI 等价性校验（备份版 -> 重构版）', () => {
	it('重构版应包含备份版出现的全部 id 元素', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		const backupIds = collectIds(backup.window.document);
		const currentIds = collectIds(current.window.document);

		const missing = Array.from(backupIds).filter((id) => !currentIds.has(id));
		expect(missing).toEqual([]);
	});

	it('重构版应包含备份版出现的全部 data-lang-key', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		const backupKeys = collectLangKeys(backup.window.document);
		const currentKeys = collectLangKeys(current.window.document);

		const missing = Array.from(backupKeys).filter((k) => !currentKeys.has(k));
		expect(missing).toEqual([]);
	});

	it('并发与重试预设按钮集合应一致', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		// 并发预设
		const backupConcurrency = collectValues(backup.window.document, '.preset-buttons .preset-btn', 'data-concurrency');
		const currentConcurrency = collectValues(current.window.document, '.preset-buttons .preset-btn', 'data-concurrency');
		expect(Array.from(currentConcurrency).sort()).toEqual(Array.from(backupConcurrency).sort());

		// 重试预设
		const backupRetry = collectValues(backup.window.document, '.retry-preset-buttons .retry-preset-btn', 'data-retry');
		const currentRetry = collectValues(current.window.document, '.retry-preset-buttons .retry-preset-btn', 'data-retry');
		expect(Array.from(currentRetry).sort()).toEqual(Array.from(backupRetry).sort());
	});

	it('结果页 Tab 与复制按钮集合应一致', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		const backupTabs = collectValues(backup.window.document, '.results-tabs .tab', 'data-tab');
		const currentTabs = collectValues(current.window.document, '.results-tabs .tab', 'data-tab');
		expect(Array.from(currentTabs).sort()).toEqual(Array.from(backupTabs).sort());

		const backupCopyKinds = collectValues(backup.window.document, '.tab-content .copy-btn', 'data-copy');
		const currentCopyKinds = collectValues(current.window.document, '.tab-content .copy-btn', 'data-copy');
		expect(Array.from(currentCopyKinds).sort()).toEqual(Array.from(backupCopyKinds).sort());
	});

	it('API 类型选项集合应一致', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		expect(Array.from(getApiTypeOptions(current.window.document)).sort())
			.toEqual(Array.from(getApiTypeOptions(backup.window.document)).sort());
	});

	it('脚本与样式引用应至少覆盖备份版的集合', () => {
		const backup = loadDom('index.backup.html');
		const current = loadDom('index.html');

		const backupLinks = getLinks(backup.window.document);
		const currentLinks = getLinks(current.window.document);
		// 样式：重构版必须包含 base.css 与 theme.css
		['css/base.css', 'css/theme.css'].forEach((href) => {
			expect(currentLinks.has(href)).toBe(true);
		});

		// 脚本：要求重构版包含备份版列出的所有脚本路径
		const backupScripts = getScripts(backup.window.document);
		const currentScripts = getScripts(current.window.document);
		const missingScripts = Array.from(backupScripts).filter((s) => !currentScripts.has(s));
		expect(missingScripts).toEqual([]);
	});

	it('占位样式注释应存在，且不再包含内联暗色主题规则', () => {
		const currentHtml = readFileSync(resolve('index.html'), 'utf-8');
		const styleMatch = currentHtml.match(/<style>[\s\S]*?<\/style>/i);
		expect(styleMatch).toBeTruthy();
		const styleBlock = styleMatch ? styleMatch[0] : '';
		expect(styleBlock).toContain('保留首屏极少量关键样式');
		expect(/\.dark-theme\s*\{/.test(styleBlock)).toBe(false);
	});
});


