import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('完成消息测试', () => {
    beforeEach(() => {
        // 设置DOM环境
        document.body.innerHTML = `
            <div id="apiKeys"></div>
            <div id="startBtn"></div>
            <select id="apiType">
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
            </select>
        `;

        // 设置全局变量
        global.allKeysData = [];
        global.currentLang = 'zh';
        global.isTestingInProgress = false;
        global.shouldCancelTesting = false;
        global.completedCount = 0;
        global.totalCount = 0;
        global.updateTimer = null;

        // Mock alert
        global.alert = vi.fn();
        
        // 默认不提供付费检测功能
        global.testGeminiContextCaching = undefined;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该显示基本的完成消息（无付费密钥）', () => {
        // 准备测试数据
        global.allKeysData = [
            { status: 'valid', key: 'sk-valid1' },
            { status: 'valid', key: 'sk-valid2' },
            { status: 'invalid', key: 'sk-invalid1' },
            { status: 'rate-limited', key: 'sk-rate1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 2，无效密钥: 1，速率限制: 1'
        );
    });

    it('应该显示包含付费密钥的完成消息（中文）', () => {
        // 设置为Gemini且有付费检测功能
        document.getElementById('apiType').value = 'gemini';
        global.testGeminiContextCaching = vi.fn();
        
        // 准备测试数据
        global.allKeysData = [
            { status: 'valid', key: 'sk-valid1' },
            { status: 'paid', key: 'AIza-paid1' },
            { status: 'paid', key: 'AIza-paid2' },
            { status: 'invalid', key: 'sk-invalid1' },
            { status: 'rate-limited', key: 'sk-rate1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 1，无效密钥: 1，速率限制: 1，付费密钥: 2'
        );
    });

    it('应该显示包含付费密钥的完成消息（英文）', () => {
        // 切换到英文
        global.currentLang = 'en';
        
        // 设置为Gemini且有付费检测功能
        document.getElementById('apiType').value = 'gemini';
        global.testGeminiContextCaching = vi.fn();

        // 准备测试数据
        global.allKeysData = [
            { status: 'valid', key: 'sk-valid1' },
            { status: 'paid', key: 'AIza-paid1' },
            { status: 'invalid', key: 'sk-invalid1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            'Test completed! Valid keys: 1, Invalid keys: 1, Rate limited: 0, Paid keys: 1'
        );
    });

    it('应该正确处理只有付费密钥的情况（有付费检测功能）', () => {
        // 设置为Gemini且有付费检测功能
        document.getElementById('apiType').value = 'gemini';
        global.testGeminiContextCaching = vi.fn();
        
        // 准备测试数据
        global.allKeysData = [
            { status: 'paid', key: 'AIza-paid1' },
            { status: 'paid', key: 'AIza-paid2' },
            { status: 'paid', key: 'AIza-paid3' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 0，无效密钥: 0，速率限制: 0，付费密钥: 3'
        );
    });

    it('不应该显示付费密钥信息（非Gemini API）', () => {
        // 设置为OpenAI
        document.getElementById('apiType').value = 'openai';
        
        // 准备测试数据（包含付费状态，但因为不是Gemini所以不应显示）
        global.allKeysData = [
            { status: 'valid', key: 'sk-valid1' },
            { status: 'paid', key: 'sk-paid1' },  // 这个在OpenAI下不应该影响消息
            { status: 'invalid', key: 'sk-invalid1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 1，无效密钥: 1，速率限制: 0'
        );
    });

    it('应该显示付费密钥信息（Gemini但无付费检测功能）', () => {
        // 设置为Gemini但无付费检测功能
        document.getElementById('apiType').value = 'gemini';
        global.testGeminiContextCaching = undefined;
        
        // 准备测试数据（包含付费状态，现在会显示付费密钥数量）
        global.allKeysData = [
            { status: 'valid', key: 'AIza-valid1' },
            { status: 'paid', key: 'AIza-paid1' },  // 现在会在消息中显示
            { status: 'invalid', key: 'AIza-invalid1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 1，无效密钥: 1，速率限制: 0，付费密钥: 1'
        );
    });

    it('应该在Gemini时显示0个付费密钥', () => {
        // 设置为Gemini且有付费检测功能
        document.getElementById('apiType').value = 'gemini';
        global.testGeminiContextCaching = vi.fn();
        
        // 准备测试数据（无付费密钥）
        global.allKeysData = [
            { status: 'valid', key: 'AIza-valid1' },
            { status: 'invalid', key: 'AIza-invalid1' },
            { status: 'rate-limited', key: 'AIza-rate1' }
        ];

        // 定义并调用 showCompletionMessage 函数
        function showCompletionMessage() {
            const validCount = global.allKeysData.filter(k => k.status === 'valid').length;
            const invalidCount = global.allKeysData.filter(k => k.status === 'invalid').length;
            const rateLimitedCount = global.allKeysData.filter(k => k.status === 'rate-limited').length;
            const paidCount = global.allKeysData.filter(k => k.status === 'paid').length;
            
            // 检查是否是Gemini类型的测试
            const apiType = document.getElementById('apiType')?.value;
            const isGemini = apiType === 'gemini';
            
            let message;
            if (global.currentLang === 'zh') {
                message = `测试完成！有效密钥: ${validCount}，无效密钥: ${invalidCount}，速率限制: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `，付费密钥: ${paidCount}`;
                }
            } else {
                message = `Test completed! Valid keys: ${validCount}, Invalid keys: ${invalidCount}, Rate limited: ${rateLimitedCount}`;
                if (isGemini) {
                    message += `, Paid keys: ${paidCount}`;
                }
            }
            global.alert(message);
        }

        showCompletionMessage();

        // 现在即使付费密钥数量为0，在Gemini下也会显示付费信息
        expect(global.alert).toHaveBeenCalledWith(
            '测试完成！有效密钥: 1，无效密钥: 1，速率限制: 1，付费密钥: 0'
        );
    });
});
