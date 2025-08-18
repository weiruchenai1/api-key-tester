import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(file) {
	return readFileSync(resolve(process.cwd(), file), 'utf-8');
}

describe('CSS externalization (Step 10)', () => {
	it('index.html should keep only placeholder in <style> and link external css', () => {
		const html = read('index.html');
		expect(html).toContain('<link rel="stylesheet" href="css/base.css" />');
		expect(html).toContain('<link rel="stylesheet" href="css/theme.css" />');
		const styleMatch = html.match(/<style>[\s\S]*?<\/style>/);
		expect(styleMatch).toBeTruthy();
		const styleBlock = styleMatch ? styleMatch[0] : '';
		expect(styleBlock).toContain('保留首屏极少量关键样式');
		expect(styleBlock).not.toMatch(/\.dark-theme\s*\{/);
	});

	it('base.css should contain light/common selectors and no .dark-theme rules', () => {
		const baseCss = read('css/base.css');
		expect(baseCss).toMatch(/\.theme-controls\b/);
		expect(baseCss).toMatch(/\.control-btn\b/);
		expect(baseCss).toMatch(/\.detected-models\b/);
		expect(baseCss).toMatch(/\.model-tag\b/);
		expect(baseCss).toMatch(/\.copy-btn\b/);
		expect(baseCss).toMatch(/\.hidden\b/);
		expect(baseCss).not.toMatch(/\.dark-theme\b/);
	});

	it('theme.css should contain dark theme overrides', () => {
		const themeCss = read('css/theme.css');
		expect(themeCss).toMatch(/\.dark-theme\b/);
		expect(themeCss).toMatch(/\.dark-theme\s*\.container/);
		expect(themeCss).toMatch(/\.dark-theme\s*\.model-tag/);
	});
});


