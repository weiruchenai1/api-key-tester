import { describe, test, expect } from 'vitest';

describe('featureFlags config', () => {
	test('defaults', async () => {
		const mod = await import('../../js/config/featureFlags.js');
		const flags = (globalThis.window && window.featureFlags) || (mod && mod.featureFlags) || globalThis.featureFlags;
		expect(flags).toBeTruthy();
		  expect(flags.paidDetection).toBe(true); // 默认开启付费检测
		expect(flags.paidDetectionMaxConcurrency).toBeGreaterThan(0);
		expect(flags.paidDetectionBackoff).toBeTruthy();
		expect(flags.paidDetectionBackoff.baseMs).toBeGreaterThan(0);
		expect(flags.paidDetectionBackoff.factor).toBeGreaterThan(1);
		expect(flags.paidDetectionBackoff.maxMs).toBeGreaterThan(flags.paidDetectionBackoff.baseMs);
		expect(flags.paidDetectionBackoff.retries).toBeGreaterThanOrEqual(0);
		expect(flags.paidDetectionMinTextLen).toBeGreaterThan(0);
	});
});


