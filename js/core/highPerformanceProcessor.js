/**
 * 高性能批量处理器 - 优化UI更新和批量操作
 * 提供高效的批量处理和智能UI更新机制
 */

class HighPerformanceProcessor {
    constructor() {
        this.config = {
            batchSize: 500,               // 批处理大小
            uiUpdateInterval: 50,         // UI更新间隔(ms)
            maxPendingUpdates: 1000,      // 最大待处理更新数
            throttleDelay: 16,            // 节流延迟(60fps)
            useRequestAnimationFrame: true, // 使用RAF优化
            enableVirtualization: true,    // 启用虚拟化
            chunkProcessingDelay: 0       // 分块处理延迟
        };
        
        // 处理队列
        this.processingQueue = {
            pending: [],
            processing: false,
            lastUpdate: 0,
            updateTimer: null,
            rafId: null
        };
        
        // UI更新缓存
        this.uiUpdateCache = {
            statusCounts: new Map(),
            pendingResults: [],
            lastRender: 0,
            isDirty: false
        };
        
        // 性能监控
        this.metrics = {
            processedBatches: 0,
            totalProcessingTime: 0,
            avgBatchTime: 0,
            uiUpdateCount: 0,
            droppedFrames: 0,
            memoryPressure: false
        };
        
        // 延迟绑定方法，确保所有方法都已定义
        setTimeout(() => this.bindMethods(), 0);
        
        console.log('[HighPerformance] 高性能处理器已启动');
    }
    
    /**
     * 绑定方法到实例
     */
    bindMethods() {
        // 确保方法存在后再绑定
        if (this.processNextBatch) {
            this.processNextBatch = this.processNextBatch.bind(this);
        }
        if (this.updateUI) {
            this.updateUI = this.updateUI.bind(this);
        }
    }

    /**
     * 批量处理API密钥
     */
    async processBatch(keys, processor, options = {}) {
        const batchConfig = { ...this.config, ...options };
        const totalKeys = keys.length;
        const batches = this.createBatches(keys, batchConfig.batchSize);
        
        console.log(`[HighPerformance] 开始批量处理: ${totalKeys} 个密钥, ${batches.length} 个批次`);
        
        const startTime = Date.now();
        let processedCount = 0;
        
        // 使用Promise.allSettled处理批次，避免单个失败影响整体
        const batchPromises = batches.map(async (batch, batchIndex) => {
            try {
                // 分块处理，避免阻塞UI
                if (batchConfig.chunkProcessingDelay > 0 && batchIndex > 0) {
                    await this.sleep(batchConfig.chunkProcessingDelay);
                }
                
                const batchStartTime = Date.now();
                const results = await this.processBatchChunk(batch, processor, batchIndex);
                const batchTime = Date.now() - batchStartTime;
                
                // 更新统计
                processedCount += batch.length;
                this.metrics.processedBatches++;
                this.metrics.totalProcessingTime += batchTime;
                
                // 缓存结果用于UI更新
                this.cacheResults(results);
                
                // 触发UI更新
                this.scheduleUIUpdate();
                
                return { batchIndex, results, processingTime: batchTime };
                
            } catch (error) {
                console.error(`[HighPerformance] 批次 ${batchIndex} 处理失败:`, error);
                return { batchIndex, error: error.message, results: [] };
            }
        });
        
        // 等待所有批次完成
        const batchResults = await Promise.allSettled(batchPromises);
        
        const totalTime = Date.now() - startTime;
        this.metrics.avgBatchTime = this.metrics.totalProcessingTime / this.metrics.processedBatches;
        
        console.log(`[HighPerformance] 批量处理完成: ${processedCount}/${totalKeys} 个密钥, 耗时: ${totalTime}ms`);
        
        // 最终UI更新
        this.forceUIUpdate();
        
        return {
            totalProcessed: processedCount,
            totalTime,
            batchResults: batchResults.map(result => result.value || result.reason),
            metrics: this.getMetrics()
        };
    }
    
    /**
     * 处理单个批次
     */
    async processBatchChunk(batch, processor, batchIndex) {
        const results = [];
        const chunkSize = Math.min(50, batch.length); // 小块处理
        
        for (let i = 0; i < batch.length; i += chunkSize) {
            const chunk = batch.slice(i, i + chunkSize);
            
            // 并行处理块内的项目
            const chunkPromises = chunk.map(async (item, index) => {
                try {
                    const result = await processor(item, batchIndex * this.config.batchSize + i + index);
                    return { success: true, result, item };
                } catch (error) {
                    return { success: false, error: error.message, item };
                }
            });
            
            const chunkResults = await Promise.allSettled(chunkPromises);
            results.push(...chunkResults.map(r => r.value || { success: false, error: r.reason }));
            
            // 让出控制权，避免阻塞UI
            if (i + chunkSize < batch.length) {
                await this.yieldToUI();
            }
        }
        
        return results;
    }
    
    /**
     * 创建批次
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    
    /**
     * 缓存处理结果
     */
    cacheResults(results) {
        this.uiUpdateCache.pendingResults.push(...results);
        this.uiUpdateCache.isDirty = true;
        
        // 更新状态计数缓存
        results.forEach(result => {
            if (result.success && result.result) {
                const status = result.result.status || 'unknown';
                const current = this.uiUpdateCache.statusCounts.get(status) || 0;
                this.uiUpdateCache.statusCounts.set(status, current + 1);
            }
        });
        
        // 限制缓存大小
        if (this.uiUpdateCache.pendingResults.length > this.config.maxPendingUpdates) {
            this.uiUpdateCache.pendingResults = this.uiUpdateCache.pendingResults.slice(-this.config.maxPendingUpdates);
        }
    }
    
    /**
     * 调度UI更新
     */
    scheduleUIUpdate() {
        const now = Date.now();
        
        if (now - this.uiUpdateCache.lastRender < this.config.uiUpdateInterval) {
            // 太频繁，跳过此次更新
            return;
        }
        
        if (this.config.useRequestAnimationFrame) {
            if (this.processingQueue.rafId) {
                cancelAnimationFrame(this.processingQueue.rafId);
            }
            this.processingQueue.rafId = requestAnimationFrame(this.updateUI);
        } else {
            if (this.processingQueue.updateTimer) {
                clearTimeout(this.processingQueue.updateTimer);
            }
            this.processingQueue.updateTimer = setTimeout(this.updateUI, this.config.throttleDelay);
        }
    }
    
    /**
     * 执行UI更新
     */
    updateUI() {
        if (!this.uiUpdateCache.isDirty) {
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // 批量更新DOM
            this.batchUpdateDOM();
            
            // 更新统计显示
            this.updateStatsDisplay();
            
            // 清理缓存
            this.uiUpdateCache.pendingResults = [];
            this.uiUpdateCache.isDirty = false;
            this.uiUpdateCache.lastRender = Date.now();
            
            this.metrics.uiUpdateCount++;
            
        } catch (error) {
            console.error('[HighPerformance] UI更新失败:', error);
        }
        
        const updateTime = Date.now() - startTime;
        if (updateTime > 16) { // 超过一帧时间
            this.metrics.droppedFrames++;
            console.warn(`[HighPerformance] UI更新耗时过长: ${updateTime}ms`);
        }
    }
    
    /**
     * 批量更新DOM
     */
    batchUpdateDOM() {
        // 使用DocumentFragment减少重排
        const fragment = document.createDocumentFragment();
        const updates = this.uiUpdateCache.pendingResults.slice(-100); // 只显示最近100个
        
        // 批量创建元素
        updates.forEach(result => {
            if (result.success && result.result) {
                const element = this.createResultElement(result.result);
                if (element) {
                    fragment.appendChild(element);
                }
            }
        });
        
        // 一次性添加到DOM
        const container = document.getElementById('allKeys');
        if (container && fragment.children.length > 0) {
            // 如果容器太大，先清理旧内容
            if (container.children.length > 1000) {
                const toRemove = container.children.length - 500;
                for (let i = 0; i < toRemove; i++) {
                    container.removeChild(container.firstChild);
                }
            }
            
            container.appendChild(fragment);
        }
    }
    
    /**
     * 创建结果元素
     */
    createResultElement(result) {
        const div = document.createElement('div');
        div.className = `key-item ${result.status}`;
        
        const statusClass = this.getStatusClass(result.status);
        div.innerHTML = `
            <span class="key-text">${this.truncateKey(result.key)}</span>
            <span class="status-badge ${statusClass}">${result.status}</span>
            ${result.error ? `<span class="error-text">${result.error.substring(0, 50)}</span>` : ''}
        `;
        
        return div;
    }
    
    /**
     * 更新统计显示
     */
    updateStatsDisplay() {
        const counts = Object.fromEntries(this.uiUpdateCache.statusCounts);
        
        // 更新各种状态计数
        Object.entries(counts).forEach(([status, count]) => {
            const element = document.getElementById(`${status}Count`);
            if (element) {
                element.textContent = count.toString();
            }
        });
        
        // 更新总计
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const totalElement = document.getElementById('totalCount');
        if (totalElement) {
            totalElement.textContent = total.toString();
        }
    }
    
    /**
     * 强制UI更新
     */
    forceUIUpdate() {
        if (this.processingQueue.rafId) {
            cancelAnimationFrame(this.processingQueue.rafId);
            this.processingQueue.rafId = null;
        }
        
        if (this.processingQueue.updateTimer) {
            clearTimeout(this.processingQueue.updateTimer);
            this.processingQueue.updateTimer = null;
        }
        
        this.updateUI();
    }
    
    /**
     * 让出控制权给UI线程
     */
    yieldToUI() {
        return new Promise(resolve => {
            if (this.config.useRequestAnimationFrame) {
                requestAnimationFrame(resolve);
            } else {
                setTimeout(resolve, 0);
            }
        });
    }
    
    /**
     * 检测内存压力
     */
    detectMemoryPressure() {
        // 简单的内存压力检测
        const memoryInfo = performance.memory;
        if (memoryInfo) {
            const usedRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
            this.metrics.memoryPressure = usedRatio > 0.8;
            
            if (this.metrics.memoryPressure) {
                console.warn('[HighPerformance] 检测到内存压力，启用保守模式');
                this.enableConservativeMode();
            }
        }
    }
    
    /**
     * 启用保守模式
     */
    enableConservativeMode() {
        this.config.batchSize = Math.max(100, Math.floor(this.config.batchSize * 0.5));
        this.config.uiUpdateInterval = Math.max(100, this.config.uiUpdateInterval * 2);
        this.config.maxPendingUpdates = Math.max(200, Math.floor(this.config.maxPendingUpdates * 0.5));
        
        console.log('[HighPerformance] 已启用保守模式:', this.config);
    }
    
    /**
     * 工具方法
     */
    truncateKey(key) {
        return key.length > 20 ? key.substring(0, 8) + '...' + key.substring(key.length - 8) : key;
    }
    
    getStatusClass(status) {
        const statusMap = {
            'valid': 'success',
            'invalid': 'error',
            'rate-limited': 'warning',
            'paid': 'info',
            'testing': 'pending'
        };
        return statusMap[status] || 'default';
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 获取性能指标
     */
    getMetrics() {
        return {
            ...this.metrics,
            avgBatchTime: this.metrics.avgBatchTime.toFixed(2) + 'ms',
            uiUpdateRate: this.metrics.uiUpdateCount > 0 ? 
                (this.metrics.uiUpdateCount / (Date.now() / 1000)).toFixed(2) + '/s' : '0/s',
            memoryPressure: this.metrics.memoryPressure
        };
    }
    
    /**
     * 重置统计
     */
    resetMetrics() {
        this.metrics = {
            processedBatches: 0,
            totalProcessingTime: 0,
            avgBatchTime: 0,
            uiUpdateCount: 0,
            droppedFrames: 0,
            memoryPressure: false
        };
        
        this.uiUpdateCache.statusCounts.clear();
        this.uiUpdateCache.pendingResults = [];
        this.uiUpdateCache.isDirty = false;
        
        console.log('[HighPerformance] 统计数据已重置');
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[HighPerformance] 配置已更新:', newConfig);
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        if (this.processingQueue.rafId) {
            cancelAnimationFrame(this.processingQueue.rafId);
            this.processingQueue.rafId = null;
        }
        
        if (this.processingQueue.updateTimer) {
            clearTimeout(this.processingQueue.updateTimer);
            this.processingQueue.updateTimer = null;
        }
        
        // 清理队列和缓存
        this.processingQueue.pending = [];
        this.uiUpdateCache.pendingResults = [];
        this.uiUpdateCache.statusCounts.clear();
        this.uiUpdateCache.isDirty = false;
        
        console.log('[HighPerformance] 资源已清理');
    }
}

// 创建全局实例
const highPerformanceProcessor = new HighPerformanceProcessor();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.highPerformanceProcessor = highPerformanceProcessor;
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        highPerformanceProcessor.cleanup();
    });
}

export default highPerformanceProcessor;
