import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('services/router testApiKey', () => {
	let testOpenAIKey, testClaudeKey, testGeminiKey;

	beforeEach(async () => {
		vi.resetModules();
		// 创建假的全局函数供 router 调用
		testOpenAIKey = vi.fn(async () => ({ valid: true }));
		testClaudeKey = vi.fn(async () => ({ valid: false, error: 'invalid' }));
		testGeminiKey = vi.fn(async () => ({ valid: false, error: '429' }));
		Object.assign(globalThis, { testOpenAIKey, testClaudeKey, testGeminiKey });
		await import('../../js/services/router.js');
	});

	it('路由到 openai/claude/gemini', async () => {
		const res1 = await window.testApiKey('k1', 'openai');
		expect(testOpenAIKey).toHaveBeenCalledWith('k1');
		expect(res1.valid).toBe(true);

		const res2 = await window.testApiKey('k2', 'claude');
		expect(testClaudeKey).toHaveBeenCalledWith('k2');
		expect(res2.valid).toBe(false);
		expect(res2.isRateLimit).not.toBe(true);

		const res3 = await window.testApiKey('k3', 'gemini');
		expect(testGeminiKey).toHaveBeenCalledWith('k3');
		expect(res3.valid).toBe(false);
		expect(res3.isRateLimit).toBe(true);
	});

	it('不支持的类型返回默认错误', async () => {
		const res = await window.testApiKey('k4', 'unknown');
		expect(res.valid).toBe(false);
		expect(res.error).toContain('不支持');
	});
});


