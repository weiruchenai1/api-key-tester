/**
 * 高速检测控制器 - 集成所有优化模块
 * 提供最高性能的API密钥检测，防止内存泄漏
 */

class HighSpeedController {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.shouldStop = false;
        
        // 模块引用
        this.modules = {
            adaptiveConcurrencyManager: null,
            smartRetryManager: null,
            enhancedMemoryManager: null,
            highPerformanceProcessor: null,
            networkOptimizer: null
        };
        
        // 全局配置
        this.config = {
            maxConcurrency: 50,           // 最大并发数
            initialConcurrency: 10,       // 初始并发数
            enableAdaptiveConcurrency: true, // 启用自适应并发
            enableSmartRetry: true,       // 启用智能重试
            enableMemoryOptimization: true, // 启用内存优化
            enableNetworkOptimization: true, // 启用网络优化
            enableBatchProcessing: true,  // 启用批处理
            batchSize: 1000,             // 批处理大小
            memoryCleanupInterval: 30000, // 内存清理间隔
            statsUpdateInterval: 1000    // 统计更新间隔
        };
        
        // 性能统计
        this.globalStats = {
            startTime: 0,
            endTime: 0,
            totalKeys: 0,
            processedKeys: 0,
            validKeys: 0,
            invalidKeys: 0,
            rateLimitedKeys: 0,
            paidKeys: 0,
            avgProcessingSpeed: 0,
            peakConcurrency: 0,
            memoryUsage: 0,
            networkEfficiency: 0,
            totalRequests: 0,
            successRate: 0,
            avgResponseTime: 0
        };
        
        // 状态监控
        this.statusMonitor = {
            timer: null,
            lastUpdate: 0,
            updateCallbacks: []
        };
        
        console.log('[HighSpeedController] 高速检测控制器已创建');
    }
    
    /**
     * 初始化所有优化模块
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('[HighSpeedController] 已经初始化，跳过');
            return;
        }
        
        console.log('[HighSpeedController] 开始初始化优化模块...');
        
        try {
            // 初始化自适应并发控制器
            if (this.config.enableAdaptiveConcurrency && typeof adaptiveConcurrencyManager !== 'undefined') {
                this.modules.adaptiveConcurrencyManager = adaptiveConcurrencyManager;
                if (this.modules.adaptiveConcurrencyManager.updateConfig) {
                    this.modules.adaptiveConcurrencyManager.updateConfig({
                        maxAllowedConcurrency: this.config.maxConcurrency
                    });
                }
                console.log('[HighSpeedController] ✓ 自适应并发控制器已启用');
            }
            
            // 初始化智能重试管理器
            if (this.config.enableSmartRetry && typeof smartRetryManager !== 'undefined') {
                this.modules.smartRetryManager = smartRetryManager;
                console.log('[HighSpeedController] ✓ 智能重试管理器已启用');
            }
            
            // 初始化增强内存管理器
            if (this.config.enableMemoryOptimization && typeof enhancedMemoryManager !== 'undefined') {
                this.modules.enhancedMemoryManager = enhancedMemoryManager;
                console.log('[HighSpeedController] ✓ 增强内存管理器已启用');
            }
            
            // 初始化高性能处理器
            if (this.config.enableBatchProcessing && typeof highPerformanceProcessor !== 'undefined') {
                this.modules.highPerformanceProcessor = highPerformanceProcessor;
                this.modules.highPerformanceProcessor.updateConfig({
                    batchSize: this.config.batchSize
                });
                console.log('[HighSpeedController] ✓ 高性能处理器已启用');
            }
            
            // 初始化网络优化器
            if (this.config.enableNetworkOptimization && typeof networkOptimizer !== 'undefined') {
                this.modules.networkOptimizer = networkOptimizer;
                console.log('[HighSpeedController] ✓ 网络优化器已启用');
            }
            
            // 启动状态监控
            this.startStatusMonitoring();
            
            this.isInitialized = true;
            console.log('[HighSpeedController] ✅ 所有优化模块初始化完成');
            
        } catch (error) {
            console.error('[HighSpeedController] 初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 高速检测API密钥
     */
    async detectKeysAtHighSpeed(keys, apiType, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.isRunning) {
            throw new Error('检测已在进行中');
        }
        
        this.isRunning = true;
        this.shouldStop = false;
        
        // 重置统计
        this.resetGlobalStats();
        this.globalStats.startTime = Date.now();
        this.globalStats.totalKeys = keys.length;
        
        console.log(`[HighSpeedController] 🚀 开始高速检测: ${keys.length} 个密钥`);
        
        try {
            // 预处理密钥
            const processedKeys = await this.preprocessKeys(keys);
            
            // 执行高速检测
            const results = await this.executeHighSpeedDetection(processedKeys, apiType, options);
            
            // 后处理结果
            const finalResults = await this.postprocessResults(results);
            
            this.globalStats.endTime = Date.now();
            this.calculateFinalStats();
            
            console.log(`[HighSpeedController] ✅ 检测完成: ${this.globalStats.processedKeys}/${this.globalStats.totalKeys} 个密钥`);
            console.log(`[HighSpeedController] 📊 平均速度: ${this.globalStats.avgProcessingSpeed.toFixed(1)} keys/s`);
            
            return finalResults;
            
        } catch (error) {
            console.error('[HighSpeedController] 检测失败:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }
    
    /**
     * 预处理密钥
     */
    async preprocessKeys(keys) {
        console.log('[HighSpeedController] 预处理密钥...');
        
        // 去重
        const uniqueKeys = [...new Set(keys)];
        console.log(`[HighSpeedController] 去重后: ${uniqueKeys.length}/${keys.length} 个密钥`);
        
        // 添加到内存管理器
        if (this.modules.enhancedMemory) {
            uniqueKeys.forEach(key => {
                this.modules.enhancedMemory.addKey({
                    key,
                    status: 'pending',
                    startTime: Date.now()
                });
            });
        }
        
        return uniqueKeys;
    }
    
    /**
     * 执行高速检测
     */
    async executeHighSpeedDetection(keys, apiType, options) {
        const concurrencyManager = this.modules.adaptiveConcurrency;
        const retryManager = this.modules.smartRetry;
        const networkOptimizer = this.modules.networkOptimizer;
        
        // 创建检测任务
        const detectTask = async (key, index) => {
            let slot = null;
            
            try {
                // 获取并发槽位
                if (concurrencyManager) {
                    slot = await concurrencyManager.acquireSlot();
                }
                
                // 执行检测
                const result = await this.detectSingleKey(key, apiType, {
                    retryManager,
                    networkOptimizer,
                    index
                });
                
                // 更新内存管理器
                if (this.modules.enhancedMemory) {
                    this.modules.enhancedMemory.updateKeyStatus(key, result.status, result);
                }
                
                // 更新统计
                this.updateProcessingStats(result);
                
                return result;
                
            } catch (error) {
                console.error(`[HighSpeedController] 密钥检测失败 ${key.substring(0, 8)}:`, error);
                
                const errorResult = {
                    key,
                    status: 'invalid',
                    error: error.message,
                    valid: false
                };
                
                if (this.modules.enhancedMemory) {
                    this.modules.enhancedMemory.updateKeyStatus(key, 'invalid', errorResult);
                }
                
                return errorResult;
                
            } finally {
                // 释放槽位
                if (concurrencyManager && slot) {
                    concurrencyManager.releaseSlot(slot, { success: true });
                }
            }
        };
        
        // 使用高性能处理器执行批量检测
        if (this.modules.highPerformanceProcessor) {
            return await this.modules.highPerformanceProcessor.processBatch(
                keys, 
                detectTask,
                { batchSize: this.config.batchSize }
            );
        } else {
            // 后备方案：直接并发执行
            const promises = keys.map(detectTask);
            return await Promise.allSettled(promises);
        }
    }
    
    /**
     * 检测单个密钥
     */
    async detectSingleKey(key, apiType, { retryManager, networkOptimizer, index }) {
        const testFunction = async () => {
            // 构建请求
            const { url, options } = this.buildTestRequest(key, apiType);
            
            // 使用网络优化器发送请求
            const response = networkOptimizer ? 
                await networkOptimizer.optimizedFetch(url, options) :
                await fetch(url, options);
            
            // 解析响应
            return await this.parseTestResponse(response, key, apiType);
        };
        
        // 使用智能重试执行
        if (retryManager) {
            return await retryManager.executeWithRetry(key, testFunction, { apiType });
        } else {
            return await testFunction();
        }
    }
    
    /**
     * 构建测试请求
     */
    buildTestRequest(key, apiType) {
        // 获取API配置
        const apiConfig = this.getApiConfig(apiType);
        const proxyUrl = document.getElementById('proxyUrl')?.value || apiConfig.defaultProxy;
        const model = this.getSelectedModel(apiType);
        
        const url = `${proxyUrl}${apiConfig.endpoint}`;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                ...apiConfig.headers
            },
            body: JSON.stringify({
                model: model,
                ...apiConfig.testPayload
            })
        };
        
        return { url, options };
    }
    
    /**
     * 解析测试响应
     */
    async parseTestResponse(response, key, apiType) {
        const result = {
            key,
            status: 'invalid',
            valid: false,
            error: null,
            model: null,
            isPaid: false
        };
        
        try {
            if (response.ok) {
                result.status = 'valid';
                result.valid = true;
                
                const data = await response.json();
                result.model = data.model || this.getSelectedModel(apiType);
                
                // 检测付费状态（仅Gemini）
                if (apiType === 'gemini') {
                    result.isPaid = await this.detectPaidStatus(key);
                    if (result.isPaid) {
                        result.status = 'paid';
                    }
                }
                
            } else if (response.status === 429) {
                result.status = 'rate-limited';
                result.error = 'Rate limited';
                
            } else {
                result.error = `HTTP ${response.status}: ${response.statusText}`;
            }
            
        } catch (error) {
            result.error = error.message;
        }
        
        return result;
    }
    
    /**
     * 检测付费状态
     */
    async detectPaidStatus(key) {
        // 简化的付费检测逻辑
        try {
            const proxyUrl = document.getElementById('proxyUrl')?.value;
            if (!proxyUrl) return false;
            
            const paidTestUrl = `${proxyUrl}/v1beta/cachedContents`;
            const response = await fetch(paidTestUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.warn('[HighSpeedController] 付费检测失败:', error.message);
            return false;
        }
    }
    
    /**
     * 后处理结果
     */
    async postprocessResults(results) {
        console.log('[HighSpeedController] 后处理结果...');
        
        // 整理结果
        const processedResults = results.batchResults ? 
            results.batchResults.flatMap(batch => batch.results || []) :
            results.map(r => r.value || r.reason);
        
        // 更新全局数据
        if (typeof allKeysData !== 'undefined') {
            allKeysData.length = 0;
            allKeysData.push(...processedResults.map(r => r.result || r));
        }
        
        return processedResults;
    }
    
    /**
     * 更新处理统计
     */
    updateProcessingStats(result) {
        this.globalStats.processedKeys++;
        
        switch (result.status) {
            case 'valid':
                this.globalStats.validKeys++;
                break;
            case 'invalid':
                this.globalStats.invalidKeys++;
                break;
            case 'rate-limited':
                this.globalStats.rateLimitedKeys++;
                break;
            case 'paid':
                this.globalStats.paidKeys++;
                break;
        }
        
        // 更新峰值并发
        if (this.modules.adaptiveConcurrency) {
            const stats = this.modules.adaptiveConcurrency.getDetailedStats();
            this.globalStats.peakConcurrency = Math.max(
                this.globalStats.peakConcurrency,
                stats.concurrency.running
            );
        }
    }
    
    /**
     * 计算最终统计
     */
    calculateFinalStats() {
        const totalTime = this.globalStats.endTime - this.globalStats.startTime;
        this.globalStats.avgProcessingSpeed = this.globalStats.processedKeys / (totalTime / 1000);
        
        // 计算内存使用
        if (this.modules.enhancedMemory) {
            const memStats = this.modules.enhancedMemory.getDetailedStats();
            this.globalStats.memoryUsage = memStats.memory.estimatedUsage;
        }
        
        // 计算网络效率
        if (this.modules.networkOptimizer) {
            const netStats = this.modules.networkOptimizer.getDetailedStats();
            this.globalStats.networkEfficiency = parseFloat(netStats.requests.mergeRatio) || 0;
        }
    }
    
    /**
     * 启动状态监控
     */
    startStatusMonitoring() {
        if (this.statusMonitor.timer) {
            clearInterval(this.statusMonitor.timer);
        }
        
        this.statusMonitor.timer = setInterval(() => {
            try {
                this.updateStatus();
            } catch (error) {
                console.error('[HighSpeedController] 状态监控出错:', error);
            }
        }, this.config.statsUpdateInterval);
    }
    
    /**
     * 更新状态
     */
    updateStatus() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const elapsed = now - this.globalStats.startTime;
        const currentSpeed = this.globalStats.processedKeys / (elapsed / 1000);
        
        // 更新进度条
        const progress = (this.globalStats.processedKeys / this.globalStats.totalKeys) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // 触发回调
        this.statusMonitor.updateCallbacks.forEach(callback => {
            try {
                callback({
                    progress,
                    speed: currentSpeed,
                    processed: this.globalStats.processedKeys,
                    total: this.globalStats.totalKeys,
                    elapsed
                });
            } catch (error) {
                console.error('[HighSpeedController] 状态回调错误:', error);
            }
        });
    }
    
    /**
     * 停止检测
     */
    stop() {
        this.shouldStop = true;
        console.log('[HighSpeedController] 停止信号已发送');
    }
    
    /**
     * 获取API配置
     */
    getApiConfig(apiType) {
        const configs = {
            openai: {
                endpoint: '/v1/chat/completions',
                defaultProxy: 'https://openai.weiruchenai.me',
                headers: {},
                testPayload: {
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                }
            },
            claude: {
                endpoint: '/v1/messages',
                defaultProxy: 'https://claude.weiruchenai.me',
                headers: { 'anthropic-version': '2023-06-01' },
                testPayload: {
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                }
            },
            gemini: {
                endpoint: '/v1beta/models/gemini-pro:generateContent',
                defaultProxy: 'https://gemini.weiruchenai.me',
                headers: {},
                testPayload: {
                    contents: [{ parts: [{ text: 'test' }] }]
                }
            }
        };
        
        return configs[apiType] || configs.openai;
    }
    
    /**
     * 获取选中的模型
     */
    getSelectedModel(apiType) {
        const modelSelect = document.getElementById('modelSelect');
        const modelInput = document.getElementById('modelInput');
        
        if (modelInput && !modelInput.classList.contains('hidden') && modelInput.value) {
            return modelInput.value;
        }
        
        if (modelSelect && modelSelect.value) {
            return modelSelect.value;
        }
        
        // 默认模型
        const defaultModels = {
            openai: 'gpt-3.5-turbo',
            claude: 'claude-3-haiku-20240307',
            gemini: 'gemini-pro'
        };
        
        return defaultModels[apiType] || 'gpt-3.5-turbo';
    }
    
    /**
     * 重置全局统计
     */
    resetGlobalStats() {
        this.globalStats = {
            startTime: 0,
            endTime: 0,
            totalKeys: 0,
            processedKeys: 0,
            validKeys: 0,
            invalidKeys: 0,
            rateLimitedKeys: 0,
            paidKeys: 0,
            avgProcessingSpeed: 0,
            peakConcurrency: 0,
            memoryUsage: 0,
            networkEfficiency: 0
        };
    }
    
    /**
     * 获取详细统计
     */
    getDetailedStats() {
        const moduleStats = {};
        
        Object.entries(this.modules).forEach(([name, module]) => {
            if (module && typeof module.getDetailedStats === 'function') {
                moduleStats[name] = module.getDetailedStats();
            }
        });
        
        return {
            global: this.globalStats,
            modules: moduleStats,
            config: this.config,
            status: {
                isInitialized: this.isInitialized,
                isRunning: this.isRunning
            }
        };
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // 更新各模块配置
        if (this.modules.adaptiveConcurrencyManager && newConfig.maxConcurrency) {
            this.modules.adaptiveConcurrencyManager.updateConfig({
                maxAllowedConcurrency: newConfig.maxConcurrency
            });
        }
        
        if (this.modules.highPerformanceProcessor && newConfig.batchSize) {
            this.modules.highPerformanceProcessor.updateConfig({
                batchSize: newConfig.batchSize
            });
        }
        
        console.log('[HighSpeedController] 配置已更新:', newConfig);
    }

    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        const memoryInfo = {
            total: 0,
            used: 0,
            modules: {}
        };

        if (typeof performance !== 'undefined' && performance.memory) {
            memoryInfo.total = performance.memory.totalJSHeapSize;
            memoryInfo.used = performance.memory.usedJSHeapSize;
        }

        // 获取各模块内存使用
        Object.entries(this.modules).forEach(([name, module]) => {
            if (module && typeof module.getMemoryUsage === 'function') {
                memoryInfo.modules[name] = module.getMemoryUsage();
            }
        });

        return memoryInfo;
    }

    /**
     * 检查内存压力
     */
    checkMemoryPressure() {
        const memoryUsage = this.getMemoryUsage();
        const memoryPressureThreshold = 0.8; // 80%阈值
        
        if (memoryUsage.total > 0) {
            const usageRatio = memoryUsage.used / memoryUsage.total;
            if (usageRatio > memoryPressureThreshold) {
                console.warn('[HighSpeedController] 检测到内存压力，触发清理');
                this.triggerMemoryCleanup();
                return true;
            }
        }
        
        return false;
    }

    /**
     * 触发内存清理
     */
    triggerMemoryCleanup() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.performCleanup === 'function') {
                try {
                    module.performCleanup();
                } catch (error) {
                    console.error('[HighSpeedController] 模块清理失败:', error);
                }
            }
        });
    }

    /**
     * 性能优化
     */
    optimizePerformance() {
        const stats = this.getDetailedStats();
        
        // 基于性能指标调整配置
        if (stats.global.avgResponseTime > 3000) {
            // 响应时间过长，降低并发
            const newConcurrency = Math.max(5, Math.floor(this.config.maxConcurrency * 0.8));
            this.updateConfig({ maxConcurrency: newConcurrency });
            console.log('[HighSpeedController] 性能优化: 降低并发至', newConcurrency);
        } else if (stats.global.avgResponseTime < 1000 && stats.global.successRate > 0.9) {
            // 性能良好，可以提高并发
            const newConcurrency = Math.min(100, Math.floor(this.config.maxConcurrency * 1.2));
            this.updateConfig({ maxConcurrency: newConcurrency });
            console.log('[HighSpeedController] 性能优化: 提高并发至', newConcurrency);
        }
    }

    /**
     * 添加状态更新回调
     */
    onStatusUpdate(callback) {
        this.statusMonitor.updateCallbacks.push(callback);
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        if (this.statusMonitor.timer) {
            clearInterval(this.statusMonitor.timer);
            this.statusMonitor.timer = null;
        }
        
        // 清理各个模块
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                } catch (error) {
                    console.error('[HighSpeedController] 模块清理出错:', error);
                }
            }
        });
        
        // 重置状态
        this.isInitialized = false;
        this.isRunning = false;
        this.shouldStop = false;
        this.statusMonitor.updateCallbacks = [];
        
        console.log('[HighSpeedController] 资源已清理');
    }
}

// 创建全局实例
const highSpeedController = new HighSpeedController();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.highSpeedController = highSpeedController;
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        highSpeedController.cleanup();
    });
}

export default highSpeedController;
