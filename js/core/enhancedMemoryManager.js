/**
 * 增强内存管理器 - 防止内存泄漏的高性能版本
 * 支持大规模密钥检测，智能内存回收和优化
 */

class EnhancedMemoryManager {
    constructor() {
        this.config = {
            maxKeysInMemory: 20000,        // 内存中最大密钥数
            cleanupThreshold: 15000,       // 触发清理的阈值
            keepRecentKeys: 5000,          // 保留最近的密钥数
            batchSize: 1000,               // 批处理大小
            gcInterval: 30000,             // GC间隔30秒
            compressionEnabled: true,       // 启用数据压缩
            indexingEnabled: true,         // 启用索引加速
            diskCacheEnabled: true         // 启用磁盘缓存
        };
        
        // 内存池
        this.memoryPool = {
            activeKeys: new Map(),         // 活跃密钥 (key -> data)
            completedKeys: new Map(),      // 已完成密钥
            indexMap: new Map(),           // 索引映射
            statusCounts: new Map(),       // 状态计数缓存
            lastCleanup: Date.now()
        };
        
        // 性能监控
        this.metrics = {
            memoryUsage: 0,
            totalKeys: 0,
            cleanupCount: 0,
            compressionRatio: 0,
            cacheHitRate: 0,
            gcTime: 0
        };
        
        // 启动后台任务
        this.startBackgroundTasks();
        
        console.log('[EnhancedMemory] 增强内存管理器已启动');
    }
    
    /**
     * 初始化内存管理器
     */
    async initialize() {
        // 从localStorage加载现有数据
        await this.loadFromStorage();
        
        // 重新启动后台任务
        this.startBackgroundTasks();
        
        console.log('[EnhancedMemory] 初始化完成');
    }

    /**
     * 清理所有资源
     */
    cleanup() {
        // 清理定时器
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        
        if (this.statsTimer) {
            clearInterval(this.statsTimer);
            this.statsTimer = null;
        }
        
        // 清理内存池
        this.memoryPool.activeKeys.clear();
        this.memoryPool.completedKeys.clear();
        this.memoryPool.indexMap.clear();
        this.memoryPool.statusCounts.clear();
        
        console.log('[EnhancedMemory] 资源已清理');
    }
    
    /**
     * 添加密钥到内存池
     */
    addKey(keyData) {
        const keyId = this.generateKeyId(keyData.key);
        
        // 检查是否需要清理
        if (this.shouldTriggerCleanup()) {
            this.performCleanup();
        }
        
        // 压缩数据
        const compressedData = this.compressKeyData(keyData);
        
        // 添加到活跃池
        this.memoryPool.activeKeys.set(keyId, compressedData);
        
        // 更新索引
        this.updateIndex(keyId, keyData);
        
        this.metrics.totalKeys++;
        this.updateMemoryUsage();
    }
    
    /**
     * 更新密钥状态
     */
    updateKeyStatus(key, status, additionalData = {}) {
        const keyId = this.generateKeyId(key);
        
        if (this.memoryPool.activeKeys.has(keyId)) {
            const data = this.decompressKeyData(this.memoryPool.activeKeys.get(keyId));
            data.status = status;
            data.completedAt = Date.now();
            Object.assign(data, additionalData);
            
            // 重新压缩并存储
            const compressedData = this.compressKeyData(data);
            this.memoryPool.activeKeys.set(keyId, compressedData);
            
            // 如果已完成，移动到完成池
            if (this.isCompletedStatus(status)) {
                this.memoryPool.completedKeys.set(keyId, compressedData);
                this.memoryPool.activeKeys.delete(keyId);
            }
            
            // 更新状态计数缓存
            this.updateStatusCount(status, 1);
            this.updateIndex(keyId, data);
        }
    }
    
    /**
     * 批量获取密钥
     */
    getKeysBatch(filter = {}, limit = 1000, offset = 0) {
        const results = [];
        let count = 0;
        let skipped = 0;
        
        // 合并活跃和完成的密钥
        const allKeys = new Map([...this.memoryPool.activeKeys, ...this.memoryPool.completedKeys]);
        
        for (const [keyId, compressedData] of allKeys) {
            if (skipped < offset) {
                skipped++;
                continue;
            }
            
            if (count >= limit) break;
            
            const data = this.decompressKeyData(compressedData);
            
            // 应用过滤器
            if (this.matchesFilter(data, filter)) {
                results.push(data);
                count++;
            }
        }
        
        return results;
    }
    
    /**
     * 获取状态统计
     */
    getStatusCounts() {
        // 使用缓存的计数
        if (this.memoryPool.statusCounts.size > 0) {
            return Object.fromEntries(this.memoryPool.statusCounts);
        }
        
        // 重新计算
        const counts = {};
        const allKeys = new Map([...this.memoryPool.activeKeys, ...this.memoryPool.completedKeys]);
        
        for (const [keyId, compressedData] of allKeys) {
            const data = this.decompressKeyData(compressedData);
            counts[data.status] = (counts[data.status] || 0) + 1;
        }
        
        // 更新缓存
        this.memoryPool.statusCounts.clear();
        for (const [status, count] of Object.entries(counts)) {
            this.memoryPool.statusCounts.set(status, count);
        }
        
        return counts;
    }
    
    /**
     * 执行内存清理
     */
    performCleanup() {
        const startTime = Date.now();
        console.log('[EnhancedMemory] 开始内存清理...');
        
        const totalBefore = this.memoryPool.activeKeys.size + this.memoryPool.completedKeys.size;
        
        // 1. 清理过期的活跃密钥
        this.cleanupExpiredKeys();
        
        // 2. 压缩完成的密钥
        this.compactCompletedKeys();
        
        // 3. 更新索引
        this.rebuildIndex();
        
        // 4. 清理状态计数缓存
        this.memoryPool.statusCounts.clear();
        
        const totalAfter = this.memoryPool.activeKeys.size + this.memoryPool.completedKeys.size;
        const cleanupTime = Date.now() - startTime;
        
        this.metrics.cleanupCount++;
        this.metrics.gcTime += cleanupTime;
        this.memoryPool.lastCleanup = Date.now();
        
        console.log(`[EnhancedMemory] 清理完成: ${totalBefore} -> ${totalAfter} 密钥, 耗时: ${cleanupTime}ms`);
        
        // 强制垃圾回收（如果可用）
        this.forceGarbageCollection();
    }
    
    /**
     * 清理过期的活跃密钥
     */
    cleanupExpiredKeys() {
        const now = Date.now();
        const expireThreshold = 5 * 60 * 1000; // 5分钟超时
        const keysToRemove = [];
        
        for (const [keyId, compressedData] of this.memoryPool.activeKeys) {
            const data = this.decompressKeyData(compressedData);
            if (data.startTime && (now - data.startTime) > expireThreshold) {
                keysToRemove.push(keyId);
            }
        }
        
        keysToRemove.forEach(keyId => {
            this.memoryPool.activeKeys.delete(keyId);
        });
        
        if (keysToRemove.length > 0) {
            console.log(`[EnhancedMemory] 清理过期密钥: ${keysToRemove.length} 个`);
        }
    }
    
    /**
     * 压缩完成的密钥
     */
    compactCompletedKeys() {
        if (this.memoryPool.completedKeys.size <= this.config.keepRecentKeys) {
            return;
        }
        
        // 按完成时间排序，保留最近的
        const sortedKeys = Array.from(this.memoryPool.completedKeys.entries())
            .map(([keyId, compressedData]) => {
                const data = this.decompressKeyData(compressedData);
                return { keyId, data, completedAt: data.completedAt || 0 };
            })
            .sort((a, b) => b.completedAt - a.completedAt);
        
        // 保留最近的密钥
        const keysToKeep = sortedKeys.slice(0, this.config.keepRecentKeys);
        const keysToArchive = sortedKeys.slice(this.config.keepRecentKeys);
        
        // 清空完成池并重新填充
        this.memoryPool.completedKeys.clear();
        keysToKeep.forEach(({ keyId, data }) => {
            const compressedData = this.compressKeyData(data);
            this.memoryPool.completedKeys.set(keyId, compressedData);
        });
        
        // 归档旧密钥到磁盘（如果启用）
        if (this.config.diskCacheEnabled && keysToArchive.length > 0) {
            this.archiveKeysToDisk(keysToArchive.map(item => item.data));
        }
        
        console.log(`[EnhancedMemory] 压缩完成: 保留 ${keysToKeep.length}, 归档 ${keysToArchive.length}`);
    }
    
    /**
     * 重建索引
     */
    rebuildIndex() {
        this.memoryPool.indexMap.clear();
        
        const allKeys = new Map([...this.memoryPool.activeKeys, ...this.memoryPool.completedKeys]);
        
        for (const [keyId, compressedData] of allKeys) {
            const data = this.decompressKeyData(compressedData);
            this.updateIndex(keyId, data);
        }
    }
    
    /**
     * 压缩密钥数据
     */
    compressKeyData(data) {
        if (!this.config.compressionEnabled) {
            return data;
        }
        
        // 简单的数据压缩：移除不必要的字段，缩短字符串
        const compressed = {
            k: data.key,
            s: data.status,
            t: data.completedAt || data.startTime,
            e: data.error ? data.error.substring(0, 100) : undefined, // 限制错误信息长度
            m: data.model,
            r: data.retryCount
        };
        
        // 移除undefined字段
        Object.keys(compressed).forEach(key => {
            if (compressed[key] === undefined) {
                delete compressed[key];
            }
        });
        
        return compressed;
    }
    
    /**
     * 解压缩密钥数据
     */
    decompressKeyData(compressed) {
        if (!this.config.compressionEnabled || !compressed.k) {
            return compressed;
        }
        
        return {
            key: compressed.k,
            status: compressed.s,
            completedAt: compressed.t,
            startTime: compressed.t,
            error: compressed.e,
            model: compressed.m,
            retryCount: compressed.r || 0
        };
    }
    
    /**
     * 更新索引
     */
    updateIndex(keyId, data) {
        if (!this.config.indexingEnabled) return;
        
        // 状态索引
        const statusKey = `status_${data.status}`;
        if (!this.memoryPool.indexMap.has(statusKey)) {
            this.memoryPool.indexMap.set(statusKey, new Set());
        }
        this.memoryPool.indexMap.get(statusKey).add(keyId);
        
        // 时间索引（按小时分组）
        if (data.completedAt) {
            const hourKey = `hour_${Math.floor(data.completedAt / (60 * 60 * 1000))}`;
            if (!this.memoryPool.indexMap.has(hourKey)) {
                this.memoryPool.indexMap.set(hourKey, new Set());
            }
            this.memoryPool.indexMap.get(hourKey).add(keyId);
        }
    }
    
    /**
     * 归档密钥到磁盘
     */
    archiveKeysToDisk(keys) {
        try {
            const archiveKey = `api_key_archive_${Date.now()}`;
            const archiveData = {
                timestamp: Date.now(),
                keys: keys,
                version: 2
            };
            
            localStorage.setItem(archiveKey, JSON.stringify(archiveData));
            console.log(`[EnhancedMemory] 归档 ${keys.length} 个密钥到磁盘`);
            
        } catch (error) {
            console.warn('[EnhancedMemory] 磁盘归档失败:', error.message);
        }
    }
    
    /**
     * 启动后台任务
     */
    startBackgroundTasks() {
        // 定期清理任务
        this.cleanupTimer = setInterval(() => {
            try {
                if (this.shouldTriggerCleanup()) {
                    this.performCleanup();
                }
            } catch (error) {
                console.error('[EnhancedMemory] 清理任务出错:', error);
            }
        }, this.config.gcInterval);
        
        // 定期更新内存使用统计
        this.statsTimer = setInterval(() => {
            try {
                this.updateMemoryUsage();
            } catch (error) {
                console.error('[EnhancedMemory] 统计更新出错:', error);
            }
        }, 10000);
    }
    
    /**
     * 检查是否应该触发清理
     */
    shouldTriggerCleanup() {
        const totalKeys = this.memoryPool.activeKeys.size + this.memoryPool.completedKeys.size;
        const timeSinceLastCleanup = Date.now() - this.memoryPool.lastCleanup;
        
        return totalKeys > this.config.cleanupThreshold || 
               timeSinceLastCleanup > this.config.gcInterval * 2;
    }
    
    /**
     * 更新内存使用统计
     */
    updateMemoryUsage() {
        const totalKeys = this.memoryPool.activeKeys.size + this.memoryPool.completedKeys.size;
        this.metrics.totalKeys = totalKeys;
        
        // 估算内存使用（简化计算）
        this.metrics.memoryUsage = totalKeys * 200; // 假设每个密钥约200字节
        
        // 计算压缩比
        if (this.config.compressionEnabled && totalKeys > 0) {
            this.metrics.compressionRatio = 0.6; // 估算60%的压缩率
        }
    }
    
    /**
     * 强制垃圾回收
     */
    forceGarbageCollection() {
        // 尝试触发垃圾回收
        if (typeof window !== 'undefined' && window.gc) {
            try {
                window.gc();
                console.log('[EnhancedMemory] 强制垃圾回收完成');
            } catch (e) {
                // 忽略错误
            }
        }
    }
    
    /**
     * 工具方法
     */
    generateKeyId(key) {
        return key.substring(0, 20); // 使用前20个字符作为ID
    }
    
    isCompletedStatus(status) {
        return ['valid', 'invalid', 'rate-limited', 'paid'].includes(status);
    }
    
    updateStatusCount(status, delta) {
        const current = this.memoryPool.statusCounts.get(status) || 0;
        this.memoryPool.statusCounts.set(status, current + delta);
    }
    
    matchesFilter(data, filter) {
        if (filter.status && data.status !== filter.status) return false;
        if (filter.model && data.model !== filter.model) return false;
        return true;
    }
    
    /**
     * 获取详细统计信息
     */
    getDetailedStats() {
        return {
            memory: {
                totalKeys: this.metrics.totalKeys,
                activeKeys: this.memoryPool.activeKeys.size,
                completedKeys: this.memoryPool.completedKeys.size,
                estimatedUsage: `${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
                compressionRatio: `${(this.metrics.compressionRatio * 100).toFixed(1)}%`
            },
            performance: {
                cleanupCount: this.metrics.cleanupCount,
                avgGcTime: this.metrics.cleanupCount > 0 ? 
                    `${(this.metrics.gcTime / this.metrics.cleanupCount).toFixed(0)}ms` : '0ms',
                lastCleanup: new Date(this.memoryPool.lastCleanup).toLocaleTimeString()
            },
            config: this.config
        };
    }
    
    /**
     * 重置所有数据
     */
    reset() {
        this.memoryPool.activeKeys.clear();
        this.memoryPool.completedKeys.clear();
        this.memoryPool.indexMap.clear();
        this.memoryPool.statusCounts.clear();
        
        this.metrics = {
            memoryUsage: 0,
            totalKeys: 0,
            cleanupCount: 0,
            compressionRatio: 0,
            cacheHitRate: 0,
            gcTime: 0
        };
        
        console.log('[EnhancedMemory] 内存已重置');
    }

    /**
     * 从localStorage加载数据
     */
    async loadFromStorage() {
        try {
            const stored = localStorage.getItem('enhancedMemoryData');
            if (stored) {
                const data = JSON.parse(stored);
                // 恢复关键数据
                if (data.activeKeys) {
                    data.activeKeys.forEach(([key, value]) => {
                        this.memoryPool.activeKeys.set(key, value);
                    });
                }
                if (data.completedKeys) {
                    data.completedKeys.forEach(([key, value]) => {
                        this.memoryPool.completedKeys.set(key, value);
                    });
                }
            }
        } catch (error) {
            console.warn('[EnhancedMemory] 加载存储数据失败:', error);
        }
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[EnhancedMemory] 配置已更新:', newConfig);
    }
}

// 创建全局实例
const enhancedMemoryManager = new EnhancedMemoryManager();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.enhancedMemoryManager = enhancedMemoryManager;
}

export default enhancedMemoryManager;
