/**
 * 自适应并发控制器 - 高性能版本
 * 根据网络条件和成功率动态调整并发数，实现最优检测速度
 */

class AdaptiveConcurrencyManager {
    constructor(initialConcurrency = 5) {
        // 并发控制
        this.maxConcurrency = initialConcurrency;
        this.minConcurrency = 1;
        this.maxAllowedConcurrency = 100;
        this.currentRunning = 0;
        this.waitingQueue = [];
        
        // 性能监控
        this.metrics = {
            totalRequests: 0,
            completedRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitedRequests: 0,
            totalLatency: 0,
            recentLatencies: [],
            recentSuccessRates: [],
            adjustmentHistory: []
        };
        
        // 自适应参数
        this.adaptiveConfig = {
            measurementWindow: 20,        // 测量窗口大小
            adjustmentInterval: 5000,     // 调整间隔(ms)
            latencyThreshold: 2000,       // 延迟阈值(ms)
            successRateThreshold: 0.8,    // 成功率阈值
            aggressiveScaling: true,      // 激进扩展模式
            conservativeMode: false       // 保守模式
        };
        
        // 启动自适应调整
        this.startAdaptiveAdjustment();
        
        console.log(`[AdaptiveConcurrency] 初始化完成，初始并发数: ${this.maxConcurrency}`);
    }
    
    /**
     * 获取执行槽位
     */
    async acquireSlot() {
        this.metrics.totalRequests++;
        
        return new Promise((resolve) => {
            if (this.currentRunning < this.maxConcurrency) {
                this.currentRunning++;
                const slot = this.createSlot();
                resolve(slot);
            } else {
                this.waitingQueue.push({ resolve, timestamp: Date.now() });
            }
        });
    }
    
    /**
     * 创建槽位对象
     */
    createSlot() {
        return {
            id: `adaptive-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            startTime: Date.now(),
            manager: this
        };
    }
    
    /**
     * 释放槽位并记录性能指标
     */
    releaseSlot(slot, result = {}) {
        if (!slot) return;
        
        this.currentRunning--;
        this.metrics.completedRequests++;
        
        // 记录性能指标
        const latency = Date.now() - slot.startTime;
        this.recordMetrics(latency, result);
        
        // 处理等待队列
        this.processWaitingQueue();
        
        console.log(`[AdaptiveConcurrency] 槽位释放: ${slot.id}, 延迟: ${latency}ms, 当前并发: ${this.currentRunning}`);
    }
    
    /**
     * 记录性能指标
     */
    recordMetrics(latency, result) {
        this.metrics.totalLatency += latency;
        this.metrics.recentLatencies.push(latency);
        
        // 记录成功率
        if (result.success) {
            this.metrics.successfulRequests++;
        } else if (result.status === 429) {
            this.metrics.rateLimitedRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // 维护滑动窗口
        const windowSize = this.adaptiveConfig.measurementWindow;
        if (this.metrics.recentLatencies.length > windowSize) {
            this.metrics.recentLatencies = this.metrics.recentLatencies.slice(-windowSize);
        }
        
        // 计算成功率
        const recentSuccessRate = this.calculateRecentSuccessRate();
        this.metrics.recentSuccessRates.push(recentSuccessRate);
        if (this.metrics.recentSuccessRates.length > windowSize) {
            this.metrics.recentSuccessRates = this.metrics.recentSuccessRates.slice(-windowSize);
        }
    }
    
    /**
     * 计算最近成功率
     */
    calculateRecentSuccessRate() {
        const recentRequests = Math.min(this.adaptiveConfig.measurementWindow, this.metrics.completedRequests);
        if (recentRequests === 0) return 1;
        
        const recentSuccessful = Math.max(0, this.metrics.successfulRequests - 
            (this.metrics.completedRequests - recentRequests));
        return recentSuccessful / recentRequests;
    }
    
    /**
     * 处理等待队列
     */
    processWaitingQueue() {
        while (this.waitingQueue.length > 0 && this.currentRunning < this.maxConcurrency) {
            const { resolve, timestamp } = this.waitingQueue.shift();
            this.currentRunning++;
            
            const slot = this.createSlot();
            resolve(slot);
            
            // 新增：记录等待时间
            const waitTime = Date.now() - timestamp;
            console.log(`[AdaptiveConcurrency] 等待队列处理，等待时间: ${waitTime}ms`);
        }
    }
    
    /**
     * 启动自适应调整
     */
    startAdaptiveAdjustment() {
        setInterval(() => {
            this.adjustConcurrency();
        }, this.adaptiveConfig.adjustmentInterval);
    }
    
    /**
     * 动态调整并发数
     */
    adjustConcurrency() {
        if (this.metrics.completedRequests < this.adaptiveConfig.measurementWindow) {
            return; // 数据不足，不调整
        }
        
        const avgLatency = this.getAverageLatency();
        const successRate = this.getAverageSuccessRate();
        const rateLimitRate = this.metrics.rateLimitedRequests / this.metrics.completedRequests;
        
        let newConcurrency = this.maxConcurrency;
        let reason = '';
        
        // 决策逻辑
        if (rateLimitRate > 0.1) {
            // 速率限制过多，降低并发
            newConcurrency = Math.max(this.minConcurrency, Math.floor(this.maxConcurrency * 0.7));
            reason = `速率限制过多 (${(rateLimitRate * 100).toFixed(1)}%)`;
        } else if (successRate < this.adaptiveConfig.successRateThreshold) {
            // 成功率低，适度降低并发
            newConcurrency = Math.max(this.minConcurrency, Math.floor(this.maxConcurrency * 0.8));
            reason = `成功率低 (${(successRate * 100).toFixed(1)}%)`;
        } else if (avgLatency > this.adaptiveConfig.latencyThreshold) {
            // 延迟高，降低并发
            newConcurrency = Math.max(this.minConcurrency, Math.floor(this.maxConcurrency * 0.9));
            reason = `延迟过高 (${avgLatency.toFixed(0)}ms)`;
        } else if (successRate > 0.95 && avgLatency < this.adaptiveConfig.latencyThreshold * 0.5) {
            // 性能良好，增加并发
            const scaleFactor = this.adaptiveConfig.aggressiveScaling ? 1.5 : 1.2;
            newConcurrency = Math.min(this.maxAllowedConcurrency, Math.floor(this.maxConcurrency * scaleFactor));
            reason = `性能良好，扩展并发`;
        }
        
        // 应用调整
        if (newConcurrency !== this.maxConcurrency) {
            const oldConcurrency = this.maxConcurrency;
            this.maxConcurrency = newConcurrency;
            
            this.metrics.adjustmentHistory.push({
                timestamp: Date.now(),
                from: oldConcurrency,
                to: newConcurrency,
                reason,
                metrics: {
                    avgLatency: avgLatency.toFixed(0),
                    successRate: (successRate * 100).toFixed(1),
                    rateLimitRate: (rateLimitRate * 100).toFixed(1)
                }
            });
            
            console.log(`[AdaptiveConcurrency] 并发调整: ${oldConcurrency} -> ${newConcurrency} (${reason})`);
            
            // 触发等待队列处理
            this.processWaitingQueue();
        }
    }
    
    /**
     * 获取平均延迟
     */
    getAverageLatency() {
        if (this.metrics.recentLatencies.length === 0) return 0;
        return this.metrics.recentLatencies.reduce((a, b) => a + b, 0) / this.metrics.recentLatencies.length;
    }
    
    /**
     * 获取平均成功率
     */
    getAverageSuccessRate() {
        if (this.metrics.recentSuccessRates.length === 0) return 1;
        return this.metrics.recentSuccessRates.reduce((a, b) => a + b, 0) / this.metrics.recentSuccessRates.length;
    }
    
    /**
     * 获取详细统计信息
     */
    getDetailedStats() {
        return {
            concurrency: {
                current: this.maxConcurrency,
                running: this.currentRunning,
                waiting: this.waitingQueue.length,
                min: this.minConcurrency,
                max: this.maxAllowedConcurrency
            },
            performance: {
                totalRequests: this.metrics.totalRequests,
                completedRequests: this.metrics.completedRequests,
                successRate: this.metrics.completedRequests > 0 ? 
                    (this.metrics.successfulRequests / this.metrics.completedRequests) : 0,
                avgLatency: this.getAverageLatency(),
                rateLimitRate: this.metrics.completedRequests > 0 ? 
                    (this.metrics.rateLimitedRequests / this.metrics.completedRequests) : 0
            },
            adjustments: this.metrics.adjustmentHistory.slice(-5) // 最近5次调整
        };
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.metrics = {
            totalRequests: 0,
            completedRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitedRequests: 0,
            totalLatency: 0,
            recentLatencies: [],
            recentSuccessRates: [],
            adjustmentHistory: []
        };
        console.log('[AdaptiveConcurrency] 统计数据已重置');
    }
    
    /**
     * 设置配置参数
     */
    updateConfig(config) {
        this.adaptiveConfig = { ...this.adaptiveConfig, ...config };
        console.log('[AdaptiveConcurrency] 配置已更新:', config);
    }
}

// 创建全局实例
const adaptiveConcurrencyManager = new AdaptiveConcurrencyManager();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.adaptiveConcurrencyManager = adaptiveConcurrencyManager;
}

export default adaptiveConcurrencyManager;
