/**
 * 并发控制验证测试
 * 验证正式程序是否真正应用了并发控制
 */

class ConcurrencyVerification {
    constructor() {
        this.results = {
            moduleLoading: {},
            concurrencyConfig: {},
            actualBehavior: {},
            performance: {}
        };
    }
    
    /**
     * 执行完整的并发验证
     */
    async runVerification() {
        console.log('🔍 开始并发控制验证...');
        
        try {
            // 1. 验证模块加载
            this.verifyModuleLoading();
            
            // 2. 验证并发配置
            this.verifyConcurrencyConfig();
            
            // 3. 验证实际行为
            await this.verifyActualBehavior();
            
            // 4. 生成验证报告
            const report = this.generateVerificationReport();
            
            console.log('✅ 并发控制验证完成');
            return report;
            
        } catch (error) {
            console.error('❌ 并发控制验证失败:', error);
            throw error;
        }
    }
    
    /**
     * 验证关键模块是否正确加载
     */
    verifyModuleLoading() {
        console.log('📋 验证模块加载状态...');
        
        const requiredModules = {
            globalConcurrencyManager: typeof window.globalConcurrencyManager !== 'undefined',
            processWithFixedConcurrency: typeof window.processWithFixedConcurrency === 'function',
            startKeyTest: typeof window.startKeyTest === 'function'
        };
        
        this.results.moduleLoading = requiredModules;
        
        for (const [module, loaded] of Object.entries(requiredModules)) {
            if (loaded) {
                console.log(`✅ ${module} 已加载`);
            } else {
                console.warn(`❌ ${module} 未加载`);
            }
        }
    }
    
    /**
     * 验证并发配置
     */
    verifyConcurrencyConfig() {
        console.log('⚙️ 验证并发配置...');
        
        const config = {
            hasGlobalManager: false,
            initialConcurrency: window.currentConcurrency || 0,
            maxGlobalConcurrency: 0,
            adaptiveEnabled: false,
            aimdConfig: null
        };
        
        if (typeof window.globalConcurrencyManager !== 'undefined') {
            const manager = window.globalConcurrencyManager;
            config.hasGlobalManager = true;
            config.maxGlobalConcurrency = manager.maxGlobalConcurrency;
            config.adaptiveEnabled = manager.adaptiveConfig?.enabled || false;
            config.aimdConfig = manager.adaptiveConfig;
            
            console.log(`✅ 全局并发管理器: 已启用`);
            console.log(`📊 最大并发数: ${config.maxGlobalConcurrency}`);
            console.log(`🧠 自适应策略: ${config.adaptiveEnabled ? '启用' : '禁用'}`);
        } else {
            console.warn(`❌ 全局并发管理器: 未找到`);
            console.log(`📊 固定并发数: ${config.initialConcurrency}`);
        }
        
        this.results.concurrencyConfig = config;
    }
    
    /**
     * 验证实际并发行为
     */
    async verifyActualBehavior() {
        console.log('🚀 验证实际并发行为...');
        
        const testKeys = this.generateTestKeys(15); // 生成15个测试密钥
        const startTime = Date.now();
        
        // 记录并发状态
        const concurrencyTracking = {
            maxConcurrentObserved: 0,
            concurrencySnapshots: [],
            requestTimeline: []
        };
        
        // 监控并发状态
        const monitorInterval = setInterval(() => {
            if (window.globalConcurrencyManager) {
                const currentRunning = window.globalConcurrencyManager.currentRunning;
                concurrencyTracking.concurrencySnapshots.push({
                    timestamp: Date.now(),
                    running: currentRunning
                });
                concurrencyTracking.maxConcurrentObserved = Math.max(
                    concurrencyTracking.maxConcurrentObserved,
                    currentRunning
                );
            }
        }, 100);
        
        try {
            // 模拟测试密钥处理
            await this.simulateKeyTesting(testKeys, concurrencyTracking);
            
        } finally {
            clearInterval(monitorInterval);
        }
        
        const totalTime = Date.now() - startTime;
        
        this.results.actualBehavior = {
            testKeyCount: testKeys.length,
            totalTime: totalTime,
            maxConcurrentObserved: concurrencyTracking.maxConcurrentObserved,
            concurrencySnapshots: concurrencyTracking.concurrencySnapshots,
            requestTimeline: concurrencyTracking.requestTimeline,
            avgThroughput: testKeys.length / (totalTime / 1000)
        };
        
        console.log(`📊 测试完成: ${testKeys.length} 个密钥`);
        console.log(`⏱️ 总耗时: ${totalTime}ms`);
        console.log(`🔥 观察到的最大并发数: ${concurrencyTracking.maxConcurrentObserved}`);
    }
    
    /**
     * 模拟密钥测试过程
     */
    async simulateKeyTesting(testKeys, tracking) {
        // 清空现有数据
        if (typeof window.clearAll === 'function') {
            window.clearAll();
        }
        
        // 注入测试密钥
        if (window.allKeysData) {
            window.allKeysData = testKeys.map(key => ({
                key: key,
                status: 'pending',
                type: 'openai',
                model: 'gpt-3.5-turbo'
            }));
        }
        
        // 设置API密钥文本框
        const apiKeysInput = document.getElementById('apiKeys');
        if (apiKeysInput) {
            apiKeysInput.value = testKeys.join('\n');
        }
        
        // 模拟API调用（不发送真实请求）
        this.mockApiCalls(tracking);
        
        // 调用并发处理函数
        if (typeof window.processWithFixedConcurrency === 'function') {
            await window.processWithFixedConcurrency(testKeys, 'openai');
        } else {
            console.warn('❌ processWithFixedConcurrency 函数不可用');
        }
    }
    
    /**
     * 模拟API调用来观察并发行为
     */
    mockApiCalls(tracking) {
        // 保存原始fetch
        const originalFetch = window.fetch;
        
        // 模拟fetch调用
        window.fetch = async (url, options) => {
            const requestStart = Date.now();
            tracking.requestTimeline.push({
                type: 'start',
                timestamp: requestStart,
                url: url
            });
            
            // 模拟网络延迟
            const delay = 200 + Math.random() * 300; // 200-500ms
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const requestEnd = Date.now();
            tracking.requestTimeline.push({
                type: 'end',
                timestamp: requestEnd,
                url: url,
                duration: requestEnd - requestStart
            });
            
            // 返回模拟响应
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'test response' } }]
                })
            };
        };
        
        // 在测试完成后恢复原始fetch
        setTimeout(() => {
            window.fetch = originalFetch;
        }, 10000);
    }
    
    /**
     * 生成测试密钥
     */
    generateTestKeys(count) {
        const keys = [];
        for (let i = 0; i < count; i++) {
            keys.push(`sk-test${i.toString().padStart(3, '0')}${'x'.repeat(40)}`);
        }
        return keys;
    }
    
    /**
     * 生成验证报告
     */
    generateVerificationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {},
            details: this.results,
            verdict: {},
            recommendations: []
        };
        
        // 分析并发是否真正应用
        const isConcurrencyApplied = this.analyzeConcurrencyApplication();
        
        report.summary = {
            moduleLoadingStatus: this.getModuleLoadingStatus(),
            concurrencyConfigured: this.results.concurrencyConfig.hasGlobalManager,
            maxConfiguredConcurrency: this.results.concurrencyConfig.maxGlobalConcurrency,
            maxObservedConcurrency: this.results.actualBehavior.maxConcurrentObserved,
            isConcurrencyWorking: isConcurrencyApplied.isWorking,
            throughput: this.results.actualBehavior.avgThroughput
        };
        
        report.verdict = this.generateVerdict(isConcurrencyApplied);
        report.recommendations = this.generateRecommendations(isConcurrencyApplied);
        
        return report;
    }
    
    /**
     * 分析并发是否真正应用
     */
    analyzeConcurrencyApplication() {
        const analysis = {
            isWorking: false,
            evidence: [],
            issues: []
        };
        
        // 检查模块加载
        if (!this.results.moduleLoading.globalConcurrencyManager) {
            analysis.issues.push('全局并发管理器未加载');
        }
        
        if (!this.results.moduleLoading.processWithFixedConcurrency) {
            analysis.issues.push('并发处理函数未加载');
        }
        
        // 检查配置
        if (this.results.concurrencyConfig.hasGlobalManager) {
            analysis.evidence.push('全局并发管理器已配置');
            
            const maxConfigured = this.results.concurrencyConfig.maxGlobalConcurrency;
            const maxObserved = this.results.actualBehavior.maxConcurrentObserved;
            
            if (maxConfigured > 5) {
                analysis.evidence.push(`并发数已提升: ${maxConfigured} > 5`);
            }
            
            if (maxObserved > 1) {
                analysis.evidence.push(`观察到真实并发: ${maxObserved}`);
            } else {
                analysis.issues.push('未观察到真实并发行为');
            }
            
            if (maxObserved >= Math.min(maxConfigured, 10)) {
                analysis.evidence.push('并发数接近配置值');
            }
        } else {
            analysis.issues.push('全局并发管理器未配置');
        }
        
        // 检查吞吐量
        const throughput = this.results.actualBehavior.avgThroughput;
        if (throughput > 5) {
            analysis.evidence.push(`高吞吐量: ${throughput.toFixed(1)} keys/sec`);
        }
        
        // 综合判断
        analysis.isWorking = analysis.evidence.length > analysis.issues.length && 
                           this.results.actualBehavior.maxConcurrentObserved > 1;
        
        return analysis;
    }
    
    /**
     * 获取模块加载状态
     */
    getModuleLoadingStatus() {
        const modules = this.results.moduleLoading;
        const loadedCount = Object.values(modules).filter(Boolean).length;
        const totalCount = Object.keys(modules).length;
        return `${loadedCount}/${totalCount}`;
    }
    
    /**
     * 生成最终判决
     */
    generateVerdict(analysis) {
        if (analysis.isWorking) {
            return {
                status: 'SUCCESS',
                message: '✅ 并发控制已正确应用',
                level: 'success'
            };
        } else if (analysis.evidence.length > 0) {
            return {
                status: 'PARTIAL',
                message: '⚠️ 并发控制部分工作，但存在问题',
                level: 'warning'
            };
        } else {
            return {
                status: 'FAILED',
                message: '❌ 并发控制未正确应用',
                level: 'error'
            };
        }
    }
    
    /**
     * 生成建议
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.issues.includes('全局并发管理器未加载')) {
            recommendations.push('检查 globalConcurrencyManager.js 是否正确加载');
        }
        
        if (analysis.issues.includes('未观察到真实并发行为')) {
            recommendations.push('检查 startKeyTest 函数是否使用槽位机制');
            recommendations.push('验证 Promise.all 或类似并发机制是否正常工作');
        }
        
        if (this.results.concurrencyConfig.maxGlobalConcurrency <= 5) {
            recommendations.push('考虑提高初始并发数配置');
        }
        
        if (!this.results.concurrencyConfig.adaptiveEnabled) {
            recommendations.push('启用自适应并发控制以获得更好性能');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('系统运行良好，无需特别调整');
        }
        
        return recommendations;
    }
}

// 导出验证类
if (typeof window !== 'undefined') {
    window.ConcurrencyVerification = ConcurrencyVerification;
}

// 提供快捷验证函数
window.verifyConcurrency = async function() {
    const verification = new ConcurrencyVerification();
    const report = await verification.runVerification();
    
    console.log('\n📋 并发控制验证报告:');
    console.log(`状态: ${report.verdict.message}`);
    console.log(`模块加载: ${report.summary.moduleLoadingStatus}`);
    console.log(`配置并发数: ${report.summary.maxConfiguredConcurrency}`);
    console.log(`观察并发数: ${report.summary.maxObservedConcurrency}`);
    console.log(`吞吐量: ${report.summary.throughput?.toFixed(1)} keys/sec`);
    
    if (report.recommendations.length > 0) {
        console.log('\n💡 建议:');
        report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    return report;
};

export default ConcurrencyVerification;
