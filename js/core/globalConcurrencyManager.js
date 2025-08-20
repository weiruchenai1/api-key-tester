/**
 * 全局并发总闸 - Token Bucket 实现
 * 确保所有Provider池和重试队列都受统一并发限制
 */

class GlobalConcurrencyManager {
    constructor(maxGlobalConcurrency = 30) {
        this.maxGlobalConcurrency = maxGlobalConcurrency;
        this.currentRunning = 0;
        this.waitingQueue = [];
        
        // 统计数据
        this.stats = {
            totalRequests: 0,
            completedRequests: 0,
            errorRequests: 0,
            currentWaiting: 0,
            peakConcurrency: 0
        };
        
        // 自适应参数 (暂时禁用以避免高并发时误判)
        this.adaptiveConfig = {
            enabled: false, // 临时禁用自适应调整
            minConcurrency: 5,
            maxConcurrency: 50,
            adjustmentCooldown: 5000, // 5秒调整间隔
            lastAdjustmentTime: 0
        };
        
        // 监控参数 (提高阈值以减少误判)
        this.monitoring = {
            recentErrors: [],
            recent429s: [],
            windowSize: 50, // 最近50个请求的监控窗口
            error429Threshold: 0.5, // 50% 429错误率阈值（提高以减少误判）
            totalErrorThreshold: 0.7 // 70% 总错误率阈值（提高以减少误判）
        };
    }
    
    /**
     * 申请执行槽位
     * @returns {Promise<Function>} 返回释放函数
     */
    async acquireSlot() {
        this.stats.totalRequests++;
        
        return new Promise((resolve, reject) => {
            if (this.currentRunning < this.maxGlobalConcurrency) {
                // 直接分配槽位
                this.currentRunning++;
                this.stats.peakConcurrency = Math.max(this.stats.peakConcurrency, this.currentRunning);
                
                const slot = {
                    id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    acquireTime: Date.now(),
                    releaseSlot: () => {
                        this.currentRunning--;
                        this.processWaitingQueue();
                    }
                };
                
                resolve(slot);
            } else {
                // 加入等待队列
                this.waitingQueue.push({ resolve, reject, timestamp: Date.now() });
                this.stats.currentWaiting = this.waitingQueue.length;
            }
        });
    }
    
    /**
     * 检查是否可以获取槽位（不等待）
     */
    canAcquireSlot() {
        return this.currentRunning < this.maxGlobalConcurrency;
    }
    
    /**
     * 处理等待队列
     */
    processWaitingQueue() {
        while (this.waitingQueue.length > 0 && this.currentRunning < this.maxGlobalConcurrency) {
            const { resolve } = this.waitingQueue.shift();
            this.currentRunning++;
            this.stats.peakConcurrency = Math.max(this.stats.peakConcurrency, this.currentRunning);
            
            const slot = {
                id: `slot-queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                acquireTime: Date.now(),
                releaseSlot: () => {
                    this.currentRunning--;
                    this.processWaitingQueue();
                }
            };
            
            resolve(slot);
        }
        
        this.stats.currentWaiting = this.waitingQueue.length;
    }
    
    /**
     * 释放槽位并记录结果
     */
    releaseSlot(slot, result = {}) {
        if (!slot || typeof slot.releaseSlot !== 'function') {
            console.warn('[GlobalConcurrency] Invalid slot provided for release');
            return;
        }
        
        // 释放槽位
        slot.releaseSlot();
        
        // 记录请求结果
        const success = result.success !== undefined ? result.success : true;
        const duration = result.latency || (Date.now() - slot.acquireTime);
        const errorType = result.status === 429 ? '429' : 
                         result.status >= 500 ? '5xx' : 
                         result.status >= 400 ? '4xx' : null;
        
        this.onRequestComplete(success, errorType, duration);
        
        console.log(`[GlobalConcurrency] 槽位 ${slot.id} 已释放, 成功: ${success}, 耗时: ${duration}ms, 当前并发: ${this.currentRunning}`);
    }
    
    /**
     * 记录请求结果并触发自适应调整
     */
    onRequestComplete(success, errorType = null, duration = 0) {
        this.stats.completedRequests++;
        
        if (!success) {
            this.stats.errorRequests++;
            this.monitoring.recentErrors.push({
                errorType,
                timestamp: Date.now(),
                duration
            });
            
            if (errorType === '429') {
                this.monitoring.recent429s.push(Date.now());
            }
        }
        
        // 保持监控窗口大小
        if (this.monitoring.recentErrors.length > this.monitoring.windowSize) {
            this.monitoring.recentErrors = this.monitoring.recentErrors.slice(-this.monitoring.windowSize);
        }
        
        if (this.monitoring.recent429s.length > this.monitoring.windowSize) {
            this.monitoring.recent429s = this.monitoring.recent429s.slice(-this.monitoring.windowSize);
        }
        
        // 触发自适应调整
        this.tryAdaptiveConcurrency(success, errorType, duration);
    }
    
    /**
     * 自适应并发调整 (AIMD + p90延迟 + 429防护)
     */
    tryAdaptiveConcurrency(success, errorType, duration) {
        if (!this.adaptiveConfig.enabled) return;
        
        const now = Date.now();
        if (now - this.adaptiveConfig.lastAdjustmentTime < this.adaptiveConfig.adjustmentCooldown) {
            return;
        }
        
        // 检查429错误率
        const recent429Rate = this.get429Rate();
        const recentErrorRate = this.getErrorRate();
        
        // 紧急降档条件
        if (recent429Rate > this.monitoring.error429Threshold) {
            this.emergencyReduceConcurrency('high_429_rate', recent429Rate);
            return;
        }
        
        if (recentErrorRate > this.monitoring.totalErrorThreshold) {
            this.emergencyReduceConcurrency('high_error_rate', recentErrorRate);
            return;
        }
        
        // p90延迟检查
        const p90Duration = this.getP90Duration();
        if (p90Duration > 10000) { // 10秒阈值
            this.reduceConcurrency('high_p90_latency', p90Duration);
            return;
        }
        
        // 正常AIMD调整
        if (success && recent429Rate < 0.05 && recentErrorRate < 0.1 && p90Duration < 6000) {
            // 条件良好，增加并发
            this.increaseConcurrency();
        }
        
        this.adaptiveConfig.lastAdjustmentTime = now;
    }
    
    /**
     * 紧急降档
     */
    emergencyReduceConcurrency(reason, rate) {
        const oldConcurrency = this.maxGlobalConcurrency;
        this.maxGlobalConcurrency = Math.max(
            this.adaptiveConfig.minConcurrency,
            Math.floor(this.maxGlobalConcurrency * 0.5) // 直接减半
        );
        
        console.warn(`[GlobalConcurrency] 紧急降档: ${reason} (${Math.round(rate*100)}%) ${oldConcurrency} → ${this.maxGlobalConcurrency}`);
        
        // 设置较长的冷却期
        this.adaptiveConfig.lastAdjustmentTime = Date.now() + 15000; // 额外15秒冷却
    }
    
    /**
     * 降低并发
     */
    reduceConcurrency(reason, value) {
        const oldConcurrency = this.maxGlobalConcurrency;
        this.maxGlobalConcurrency = Math.max(
            this.adaptiveConfig.minConcurrency,
            Math.floor(this.maxGlobalConcurrency * 0.8) // 减少20%
        );
        
        console.log(`[GlobalConcurrency] 降档: ${reason} (${value}) ${oldConcurrency} → ${this.maxGlobalConcurrency}`);
    }
    
    /**
     * 增加并发
     */
    increaseConcurrency() {
        const oldConcurrency = this.maxGlobalConcurrency;
        this.maxGlobalConcurrency = Math.min(
            this.adaptiveConfig.maxConcurrency,
            this.maxGlobalConcurrency + 1 // 保守增加
        );
        
        if (oldConcurrency !== this.maxGlobalConcurrency) {
            console.log(`[GlobalConcurrency] 升档: ${oldConcurrency} → ${this.maxGlobalConcurrency}`);
        }
    }
    
    /**
     * 获取429错误率
     */
    get429Rate() {
        if (this.monitoring.recent429s.length === 0) return 0;
        
        const recentCount = Math.min(this.monitoring.recent429s.length, this.monitoring.windowSize);
        const completedCount = Math.min(this.stats.completedRequests, this.monitoring.windowSize);
        
        return completedCount > 0 ? this.monitoring.recent429s.length / completedCount : 0;
    }
    
    /**
     * 获取总错误率
     */
    getErrorRate() {
        const recentErrorCount = Math.min(this.monitoring.recentErrors.length, this.monitoring.windowSize);
        const completedCount = Math.min(this.stats.completedRequests, this.monitoring.windowSize);
        
        return completedCount > 0 ? recentErrorCount / completedCount : 0;
    }
    
    /**
     * 获取p90延迟
     */
    getP90Duration() {
        const recentErrors = this.monitoring.recentErrors.slice(-20); // 最近20个
        if (recentErrors.length === 0) return 0;
        
        const durations = recentErrors
            .filter(e => e.duration > 0)
            .map(e => e.duration)
            .sort((a, b) => a - b);
            
        if (durations.length === 0) return 0;
        
        const p90Index = Math.floor(durations.length * 0.9);
        return durations[p90Index] || 0;
    }
    
    /**
     * 全局暂停机制
     */
    pause() {
        console.log('[GlobalConcurrency] 全局暂停');
        this.adaptiveConfig.enabled = false;
        
        // 清空等待队列
        this.waitingQueue.forEach(({ reject }) => {
            reject(new Error('Global concurrency paused'));
        });
        this.waitingQueue = [];
        this.stats.currentWaiting = 0;
    }
    
    /**
     * 全局恢复机制
     */
    resume() {
        console.log('[GlobalConcurrency] 全局恢复');
        this.adaptiveConfig.enabled = true;
        this.adaptiveConfig.lastAdjustmentTime = Date.now(); // 重置调整时间
    }
    
    /**
     * 获取详细统计信息
     */
    getStats() {
        return {
            global: {
                maxConcurrency: this.maxGlobalConcurrency,
                currentRunning: this.currentRunning,
                waiting: this.stats.currentWaiting,
                peakConcurrency: this.stats.peakConcurrency
            },
            performance: {
                totalRequests: this.stats.totalRequests,
                completedRequests: this.stats.completedRequests,
                successRate: this.stats.totalRequests > 0 
                    ? (this.stats.completedRequests - this.stats.errorRequests) / this.stats.completedRequests 
                    : 0,
                error429Rate: this.get429Rate(),
                totalErrorRate: this.getErrorRate(),
                p90Duration: this.getP90Duration()
            },
            adaptive: {
                ...this.adaptiveConfig,
                canIncrease: this.maxGlobalConcurrency < this.adaptiveConfig.maxConcurrency,
                canDecrease: this.maxGlobalConcurrency > this.adaptiveConfig.minConcurrency
            }
        };
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            completedRequests: 0,
            errorRequests: 0,
            currentWaiting: 0,
            peakConcurrency: 0
        };
        
        this.monitoring.recentErrors = [];
        this.monitoring.recent429s = [];
        
        console.log('[GlobalConcurrency] 统计数据已重置');
    }
}

// 创建全局实例
const globalConcurrencyManager = new GlobalConcurrencyManager();

// 页面可见性变化处理
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            globalConcurrencyManager.pause();
        } else {
            globalConcurrencyManager.resume();
        }
    });
}

try {
    if (typeof window !== 'undefined') {
        window.globalConcurrencyManager = globalConcurrencyManager;
    }
} catch (_) {}

export default globalConcurrencyManager;
