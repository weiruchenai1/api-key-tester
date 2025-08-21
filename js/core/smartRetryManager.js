/**
 * 智能重试管理器 - 高性能版本
 * 减少不必要的重试延迟，提高检测速度
 */

class SmartRetryManager {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 100,           // 基础延迟降低到100ms
            maxDelay: 2000,           // 最大延迟2秒
            backoffMultiplier: 1.5,   // 退避倍数
            jitterFactor: 0.1,        // 抖动因子
            fastFailCodes: new Set([400, 401, 403, 404]), // 快速失败的错误码
            retryableCodes: new Set([429, 500, 502, 503, 504]), // 可重试的错误码
            circuitBreakerThreshold: 0.5, // 熔断阈值
            circuitBreakerWindow: 60000    // 熔断窗口60秒
        };
        
        // 错误统计
        this.errorStats = new Map();
        this.circuitBreakers = new Map();
        
        // 性能统计
        this.stats = {
            totalRetries: 0,
            successfulRetries: 0,
            skippedRetries: 0,
            fastFails: 0,
            circuitBreakerTrips: 0
        };
    }
    
    /**
     * 初始化重试管理器
     */
    async initialize() {
        // 重置统计数据
        this.errorStats.clear();
        this.circuitBreakers.clear();
        this.stats = {
            totalRetries: 0,
            successfulRetries: 0,
            skippedRetries: 0,
            fastFails: 0,
            circuitBreakerTrips: 0
        };
        console.log('[SmartRetry] 初始化完成');
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.errorStats.clear();
        this.circuitBreakers.clear();
        console.log('[SmartRetry] 资源已清理');
    }

    /**
     * 智能重试执行器
     */
    async executeWithRetry(apiKey, testFunction, context = {}) {
        const keyPrefix = apiKey.substring(0, 12);
        let lastError = null;
        let attempt = 0;
        
        // 检查熔断器
        if (this.isCircuitBreakerOpen(context.apiType)) {
            console.log(`[SmartRetry] 熔断器开启，跳过重试: ${keyPrefix}`);
            throw new Error('Circuit breaker is open');
        }
        
        while (attempt <= this.retryConfig.maxRetries) {
            try {
                const result = await testFunction();
                
                // 成功时更新统计
                if (attempt > 0) {
                    this.stats.successfulRetries++;
                    console.log(`[SmartRetry] 重试成功: ${keyPrefix}, 尝试次数: ${attempt + 1}`);
                }
                
                this.recordSuccess(context.apiType);
                return result;
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                // 分析错误类型
                const errorAnalysis = this.analyzeError(error);
                
                // 快速失败检查
                if (errorAnalysis.shouldFastFail) {
                    this.stats.fastFails++;
                    console.log(`[SmartRetry] 快速失败: ${keyPrefix}, 错误: ${errorAnalysis.code}`);
                    throw error;
                }
                
                // 检查是否应该重试
                if (attempt > this.retryConfig.maxRetries || !errorAnalysis.shouldRetry) {
                    this.recordFailure(context.apiType, error);
                    break;
                }
                
                // 计算延迟
                const delay = this.calculateDelay(attempt, errorAnalysis);
                
                // 记录重试
                this.stats.totalRetries++;
                console.log(`[SmartRetry] 准备重试: ${keyPrefix}, 尝试 ${attempt + 1}/${this.retryConfig.maxRetries + 1}, 延迟: ${delay}ms`);
                
                // 等待后重试
                if (delay > 0) {
                    await this.sleep(delay);
                }
            }
        }
        
        // 所有重试都失败了
        if (lastError) {
            this.recordFailure(context.apiType, lastError);
            throw lastError;
        } else {
            const error = new Error('All retries failed without specific error');
            this.recordFailure(context.apiType, error);
            throw error;
        }
    }
    
    /**
     * 分析错误类型
     */
    analyzeError(error) {
        const analysis = {
            code: null,
            shouldRetry: false,
            shouldFastFail: false,
            priority: 'normal'
        };
        
        // 从错误中提取状态码
        if (error.status) {
            analysis.code = error.status;
        } else if (error.message) {
            // 尝试从错误消息中提取状态码
            const statusMatch = error.message.match(/(\d{3})/);
            if (statusMatch) {
                analysis.code = parseInt(statusMatch[1]);
            }
        }
        
        // 决策逻辑
        if (analysis.code) {
            if (this.retryConfig.fastFailCodes.has(analysis.code)) {
                analysis.shouldFastFail = true;
                analysis.shouldRetry = false;
            } else if (this.retryConfig.retryableCodes.has(analysis.code)) {
                analysis.shouldRetry = true;
                analysis.priority = analysis.code === 429 ? 'high' : 'normal';
            }
        } else {
            // 网络错误等，通常可以重试
            if (error.message.includes('fetch') || 
                error.message.includes('network') || 
                error.message.includes('timeout')) {
                analysis.shouldRetry = true;
                analysis.priority = 'low';
            }
        }
        
        return analysis;
    }
    
    /**
     * 计算重试延迟
     */
    calculateDelay(attempt, errorAnalysis) {
        let delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        // 根据错误类型调整延迟
        switch (errorAnalysis.priority) {
            case 'high':
                delay *= 2; // 429错误需要更长延迟
                break;
            case 'low':
                delay *= 0.5; // 网络错误可以更快重试
                break;
        }
        
        // 应用最大延迟限制
        delay = Math.min(delay, this.retryConfig.maxDelay);
        
        // 添加抖动
        const jitter = delay * this.retryConfig.jitterFactor * (Math.random() - 0.5);
        delay += jitter;
        
        return Math.max(0, Math.floor(delay));
    }
    
    /**
     * 记录成功
     */
    recordSuccess(apiType) {
        if (!apiType) return;
        
        const key = `success_${apiType}`;
        const now = Date.now();
        
        if (!this.errorStats.has(key)) {
            this.errorStats.set(key, []);
        }
        
        this.errorStats.get(key).push(now);
        this.cleanupOldStats(key);
    }
    
    /**
     * 记录失败
     */
    recordFailure(apiType, error) {
        if (!apiType) return;
        
        const key = `failure_${apiType}`;
        const now = Date.now();
        
        if (!this.errorStats.has(key)) {
            this.errorStats.set(key, []);
        }
        
        this.errorStats.get(key).push({ timestamp: now, error: error.message });
        this.cleanupOldStats(key);
        
        // 检查是否需要触发熔断器
        this.checkCircuitBreaker(apiType);
    }
    
    /**
     * 检查熔断器状态
     */
    isCircuitBreakerOpen(apiType) {
        if (!apiType) return false;
        
        const breaker = this.circuitBreakers.get(apiType);
        if (!breaker) return false;
        
        const now = Date.now();
        
        // 检查熔断器是否应该关闭
        if (now - breaker.openTime > this.retryConfig.circuitBreakerWindow) {
            this.circuitBreakers.delete(apiType);
            console.log(`[SmartRetry] 熔断器已关闭: ${apiType}`);
            return false;
        }
        
        return breaker.isOpen;
    }
    
    /**
     * 检查并可能触发熔断器
     */
    checkCircuitBreaker(apiType) {
        const successKey = `success_${apiType}`;
        const failureKey = `failure_${apiType}`;
        
        const successes = this.errorStats.get(successKey) || [];
        const failures = this.errorStats.get(failureKey) || [];
        
        const totalRequests = successes.length + failures.length;
        
        if (totalRequests >= 10) { // 至少10个请求才考虑熔断
            const failureRate = failures.length / totalRequests;
            
            if (failureRate > this.retryConfig.circuitBreakerThreshold) {
                this.circuitBreakers.set(apiType, {
                    isOpen: true,
                    openTime: Date.now(),
                    failureRate
                });
                
                this.stats.circuitBreakerTrips++;
                console.warn(`[SmartRetry] 熔断器触发: ${apiType}, 失败率: ${(failureRate * 100).toFixed(1)}%`);
            }
        }
    }
    
    /**
     * 清理旧的统计数据
     */
    cleanupOldStats(key) {
        const stats = this.errorStats.get(key);
        if (!stats) return;
        
        const cutoff = Date.now() - this.retryConfig.circuitBreakerWindow;
        
        if (Array.isArray(stats)) {
            // 成功记录是简单的时间戳数组
            const filtered = stats.filter(timestamp => timestamp > cutoff);
            this.errorStats.set(key, filtered);
        } else {
            // 失败记录是对象数组
            const filtered = stats.filter(record => record.timestamp > cutoff);
            this.errorStats.set(key, filtered);
        }
    }
    
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([apiType, breaker]) => ({
                apiType,
                isOpen: breaker.isOpen,
                failureRate: breaker.failureRate,
                openTime: breaker.openTime
            })),
            errorStats: this.getErrorStatsSummary()
        };
    }
    
    /**
     * 获取错误统计摘要
     */
    getErrorStatsSummary() {
        const summary = {};
        
        for (const [key, stats] of this.errorStats.entries()) {
            const [type, apiType] = key.split('_');
            
            if (!summary[apiType]) {
                summary[apiType] = { successes: 0, failures: 0 };
            }
            
            if (type === 'success') {
                summary[apiType].successes = stats.length;
            } else if (type === 'failure') {
                summary[apiType].failures = stats.length;
            }
        }
        
        return summary;
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats = {
            totalRetries: 0,
            successfulRetries: 0,
            skippedRetries: 0,
            fastFails: 0,
            circuitBreakerTrips: 0
        };
        
        this.errorStats.clear();
        this.circuitBreakers.clear();
        
        console.log('[SmartRetry] 统计数据已重置');
    }
    
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.retryConfig = { ...this.retryConfig, ...config };
        console.log('[SmartRetry] 配置已更新:', config);
    }
    
    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局实例
const smartRetryManager = new SmartRetryManager();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.smartRetryManager = smartRetryManager;
}

export default smartRetryManager;
