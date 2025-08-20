/**
 * 全局并发控制器 - 简化版本
 * 提供固定并发数的Token Bucket实现
 */

class GlobalConcurrencyManager {
    constructor(maxGlobalConcurrency = 5) {
        this.maxGlobalConcurrency = maxGlobalConcurrency;
        this.currentRunning = 0;
        this.waitingQueue = [];
        
        // 基本统计数据
        this.stats = {
            totalRequests: 0,
            completedRequests: 0,
            currentWaiting: 0,
            peakConcurrency: 0
        };
    }
    
    /**
     * 申请执行槽位
     * @returns {Promise<Object>} 返回槽位对象
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
                    acquireTime: Date.now()
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
                acquireTime: Date.now()
            };
            
            resolve(slot);
        }
        
        this.stats.currentWaiting = this.waitingQueue.length;
    }
    
    /**
     * 释放槽位
     */
    releaseSlot(slot, result = {}) {
        if (!slot) {
            console.warn('[GlobalConcurrency] Invalid slot provided for release');
            return;
        }
        
        // 释放槽位
        this.currentRunning--;
        this.stats.completedRequests++;
        
        // 处理等待队列
        this.processWaitingQueue();
        
        const duration = result.latency || (Date.now() - slot.acquireTime);
        console.log(`[GlobalConcurrency] 槽位 ${slot.id} 已释放, 耗时: ${duration}ms, 当前并发: ${this.currentRunning}`);
    }
    
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            maxConcurrency: this.maxGlobalConcurrency,
            currentRunning: this.currentRunning,
            waiting: this.stats.currentWaiting,
            peakConcurrency: this.stats.peakConcurrency,
            totalRequests: this.stats.totalRequests,
            completedRequests: this.stats.completedRequests
        };
    }
    
    /**
     * 获取详细指标（兼容性方法）
     */
    getMetrics() {
        return this.getStats();
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            completedRequests: 0,
            currentWaiting: 0,
            peakConcurrency: 0
        };
        
        console.log('[GlobalConcurrency] 统计数据已重置');
    }
}

// 创建全局实例
const globalConcurrencyManager = new GlobalConcurrencyManager();

try {
    if (typeof window !== 'undefined') {
        window.globalConcurrencyManager = globalConcurrencyManager;
    }
} catch (_) {}

export default globalConcurrencyManager;