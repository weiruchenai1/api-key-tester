// E2E 测试：付费密钥检测功能
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('付费密钥检测 E2E 测试', () => {
	let dom, document, window;
	let originalFetch;

	beforeEach(() => {
		// 设置 DOM 环境
		dom = new JSDOM(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Test</title>
			</head>
			<body>
				<div class="stats">
					<div class="stat-card">
						<span class="stat-number" id="totalCount">0</span>
						<span class="stat-label">总数</span>
					</div>
					<div class="stat-card">
						<span class="stat-number" id="validCount">0</span>
						<span class="stat-label">有效</span>
					</div>
					<div class="stat-card">
						<span class="stat-number" id="invalidCount">0</span>
						<span class="stat-label">无效</span>
					</div>
					<div class="stat-card">
						<span class="stat-number" id="rateLimitedCount">0</span>
						<span class="stat-label">限流</span>
					</div>
					<div class="stat-card">
						<span class="stat-number" id="paidCount">0</span>
						<span class="stat-label">付费</span>
					</div>
				</div>
				<div class="tab-content" id="validList"></div>
				<div class="tab-content" id="invalidList"></div>
				<div class="tab-content" id="rateLimitedList"></div>
				<div class="tab-content" id="paidList"></div>
			</body>
			</html>
		`, { 
			url: 'http://localhost',
			pretendToBeVisual: true,
			resources: 'usable'
		});

		document = dom.window.document;
		window = dom.window;
		global.document = document;
		global.window = window;

		// Mock fetch
		originalFetch = global.fetch;
		global.fetch = vi.fn();

		// 设置特性标志，开启付费检测
		global.featureFlags = {
			paidDetection: true,
			paidDetectionMaxConcurrency: 5,
			debugQueue: false
		};

		// 初始化全局变量
		window.allKeysData = [];
		window.validKeys = [];
		window.invalidKeys = [];
		window.rateLimitedKeys = [];
		window.paidKeys = [];
		window.shouldCancelTesting = false;
		window.completedCount = 0;
		window.totalCount = 0;
		window.currentConcurrency = 3;
		window.currentRetryCount = 1;
		
		// Mock 函数
		window.testApiKeyWithRetry = vi.fn();
		window.updateUIAsync = vi.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.clearAllMocks();
		delete global.featureFlags;
		delete global.document;
		delete global.window;
	});

	it('应该正确识别付费和免费 Gemini 密钥', async () => {
		// 模拟 API 响应
		global.fetch.mockImplementation((url) => {
			if (url.includes('/v1beta/models')) {
				// 基本测试：所有密钥都返回成功
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve({ models: [{ name: 'gemini-pro' }] })
				});
			} else if (url.includes('/v1beta/cachedContents')) {
				// 付费检测：根据密钥返回不同结果
				const apiKey = url.match(/key=([^&]+)/)?.[1];
				
				if (apiKey === 'paid-key-1') {
					// 付费密钥：成功访问 cachedContents
					return Promise.resolve({
						ok: true,
						status: 200,
						json: () => Promise.resolve({ cachedContents: [] })
					});
				} else if (apiKey === 'free-key-1') {
					// 免费密钥：403 权限不足
					return Promise.resolve({
						ok: false,
						status: 403,
						json: () => Promise.resolve({
							error: {
								code: 403,
								message: "PERMISSION_DENIED: Context caching is not available"
							}
						})
					});
				}
			}
			
			return Promise.reject(new Error('Unexpected fetch call'));
		});

		// 按照正确顺序导入所有依赖
		await import('../../js/services/apiUrl.js');
		await import('../../js/config/featureFlags.js');
		await import('../../js/core/retry.js');
		await import('../../js/config/modelOptions.js');
		await import('../../js/utils/keys.js');
		await import('../../js/utils/clipboard.js');
		await import('../../js/i18n/translations.js');
		await import('../../js/i18n/i18n.js');
		await import('../../js/services/modelsService.js');
		await import('../../js/services/openaiService.js');
		await import('../../js/services/claudeService.js');
		await import('../../js/services/geminiService.js');
		await import('../../js/services/geminiPaidService.js');
		await import('../../js/services/router.js');
		
		// 确保函数可用
		expect(window.testGeminiKey).toBeDefined();
		expect(window.testApiKey).toBeDefined();
		
		// 从 window 获取函数
		const testApiKey = window.testApiKey;

		// 测试付费密钥
		const paidResult = await testApiKey('paid-key-1', 'gemini');
		expect(paidResult.valid).toBe(true);
		expect(paidResult.isPaid).toBe(true);

		// 测试免费密钥
		const freeResult = await testApiKey('free-key-1', 'gemini');
		expect(freeResult.valid).toBe(true);
		expect(freeResult.isPaid).toBe(false);
	});

	it('应该正确处理付费检测超时和错误', async () => {
		// 模拟网络超时和服务器错误
		global.fetch.mockImplementation((url) => {
			if (url.includes('/v1beta/models')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve({ models: [{ name: 'gemini-pro' }] })
				});
			} else if (url.includes('/v1beta/cachedContents')) {
				const apiKey = url.match(/key=([^&]+)/)?.[1];
				
				if (apiKey === 'timeout-key') {
					// 模拟超时
					return new Promise((_, reject) => {
						setTimeout(() => reject(new Error('Network timeout')), 100);
					});
				} else if (apiKey === 'server-error-key') {
					// 模拟服务器错误
					return Promise.resolve({
						ok: false,
						status: 500,
						json: () => Promise.resolve({
							error: { code: 500, message: "Internal server error" }
						})
					});
				}
			}
			
			return Promise.reject(new Error('Unexpected fetch call'));
		});

		// 按照正确顺序导入所有依赖
		await import('../../js/services/apiUrl.js');
		await import('../../js/config/featureFlags.js');
		await import('../../js/core/retry.js');
		await import('../../js/config/modelOptions.js');
		await import('../../js/services/modelsService.js');
		await import('../../js/services/openaiService.js');
		await import('../../js/services/claudeService.js');
		await import('../../js/services/geminiService.js');
		await import('../../js/services/geminiPaidService.js');
		await import('../../js/services/router.js');
		
		const testApiKey = window.testApiKey;

		// 测试超时密钥
		const timeoutResult = await testApiKey('timeout-key', 'gemini');
		expect(timeoutResult.status).toBe('valid'); // 超时时回退到基本测试结果
		expect(timeoutResult.isPaid).toBeUndefined(); // 付费状态未知

		// 测试服务器错误密钥
		const errorResult = await testApiKey('server-error-key', 'gemini');
		expect(errorResult.status).toBe('valid'); // 错误时回退到基本测试结果
		expect(errorResult.isPaid).toBeUndefined(); // 付费状态未知
	});

	it('应该在关闭付费检测时跳过付费测试', async () => {
		// 关闭付费检测
		global.featureFlags.paidDetection = false;

		global.fetch.mockImplementation((url) => {
			if (url.includes('/v1beta/models')) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve({ models: [{ name: 'gemini-pro' }] })
				});
			} else if (url.includes('/v1beta/cachedContents')) {
				// 付费检测应该不会被调用
				throw new Error('付费检测不应该被调用');
			}
			
			return Promise.reject(new Error('Unexpected fetch call'));
		});

		// 按照正确顺序导入所有依赖
		await import('../../js/services/apiUrl.js');
		await import('../../js/config/featureFlags.js');
		await import('../../js/core/retry.js');
		await import('../../js/config/modelOptions.js');
		await import('../../js/services/modelsService.js');
		await import('../../js/services/openaiService.js');
		await import('../../js/services/claudeService.js');
		await import('../../js/services/geminiService.js');
		await import('../../js/services/geminiPaidService.js');
		await import('../../js/services/router.js');
		
		const testApiKey = window.testApiKey;

		const result = await testApiKey('test-key', 'gemini');
		
		// 应该只返回基本测试结果，没有付费信息
		expect(result.status).toBe('valid');
		expect(result.isPaid).toBeUndefined();
		
		// 验证没有调用 cachedContents API
		const cachedContentsCalls = global.fetch.mock.calls.filter(call => 
			call[0].includes('/v1beta/cachedContents')
		);
		expect(cachedContentsCalls).toHaveLength(0);
	});
});
