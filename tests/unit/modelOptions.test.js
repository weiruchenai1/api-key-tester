import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('modelOptions 配置暴露', () => {
	beforeEach(async () => {
		vi.resetModules();
		// 确保每次重新执行脚本以设置 window.modelOptions
		delete window.modelOptions;
		await import('../../js/config/modelOptions.js');
	});

	it('应当挂载到 window.modelOptions', () => {
		expect(window.modelOptions).toBeTruthy();
		expect(typeof window.modelOptions).toBe('object');
	});

	it('包含 openai/claude/gemini 预设模型', () => {
		const { openai, claude, gemini } = window.modelOptions;
		expect(openai).toEqual(expect.arrayContaining(['gpt-4o', 'gpt-4o-mini']));
		expect(claude).toEqual(expect.arrayContaining(['claude-3-5-sonnet-20241022']));
		expect(gemini).toEqual(expect.arrayContaining(['gemini-2.0-flash']));
	});
});


