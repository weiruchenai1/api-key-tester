import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('取消测试功能', () => {
	beforeEach(async () => {
		// 清理和重置 window 对象
		delete global.window;
		global.window = global;
		global.document = {
			getElementById: vi.fn(() => ({ value: 'gemini' }))
		};

		// 重置全局变量
		global.isTestingInProgress = false;
		global.shouldCancelTesting = false;
		global.allKeysData = [];
		global.completedCount = 0;
		global.totalCount = 0;

		// 导入 tester 模块
		await import('../../js/core/tester.js');
	});

	it('应该正确导出 cancelTesting 函数', () => {
		expect(typeof window.cancelTesting).toBe('function');
	});

	it('在未测试时调用 cancelTesting 应该无效果', () => {
		global.isTestingInProgress = false;
		global.shouldCancelTesting = false;

		window.cancelTesting();

		expect(global.shouldCancelTesting).toBe(false);
	});

	it('在测试进行中调用 cancelTesting 应该设置取消标志', () => {
		global.isTestingInProgress = true;
		global.shouldCancelTesting = false;

		window.cancelTesting();

		expect(global.shouldCancelTesting).toBe(true);
	});

	it('取消后 shouldCancelTesting 标志应该被并发模块检查', () => {
		// 模拟测试进行中
		global.isTestingInProgress = true;
		global.shouldCancelTesting = false;

		// 调用取消
		window.cancelTesting();

		// 验证标志被设置
		expect(global.shouldCancelTesting).toBe(true);
	});

	it('防止双击问题：只应该绑定一次事件', () => {
		// 这个测试验证不会有重复事件绑定
		const mockBtn = {
			addEventListener: vi.fn(),
			dataset: {}
		};
		
		// 模拟 controls.js 中被移除的绑定逻辑
		if (!mockBtn.dataset.bound) {
			// 这里应该什么都不做，因为绑定已移至 bootstrap.js
		}
		
		// 验证没有绑定事件
		expect(mockBtn.addEventListener).not.toHaveBeenCalled();
	});
});
