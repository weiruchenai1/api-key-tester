// 内存管理模块 - 优化大量数据场景下的内存使用

const MEMORY_LIMITS = {
    MAX_KEYS_IN_MEMORY: 50000,      // 最大内存中保留的密钥数
    CLEANUP_THRESHOLD: 40000,       // 触发清理的阈值
    KEEP_RECENT_KEYS: 10000,        // 保留最近的密钥数量
    STORAGE_KEY: 'api_key_tester_overflow', // localStorage 键名
    ENABLE_DISK_STORAGE: true       // 是否启用磁盘存储
};

let memoryPressureWarned = false;
let diskStorageEnabled = MEMORY_LIMITS.ENABLE_DISK_STORAGE;

// 检查内存压力
function checkMemoryPressure() {
    const totalKeys = allKeysData.length;
    
    if (totalKeys > MEMORY_LIMITS.CLEANUP_THRESHOLD && !memoryPressureWarned) {
        console.warn(`[MemoryManager] 内存压力警告: 当前有 ${totalKeys} 个密钥，建议启用磁盘存储`);
        memoryPressureWarned = true;
        
        if (diskStorageEnabled) {
            triggerMemoryCleanup();
        }
    }
    
    return {
        totalKeys,
        memoryPressure: totalKeys > MEMORY_LIMITS.CLEANUP_THRESHOLD,
        needsCleanup: totalKeys > MEMORY_LIMITS.MAX_KEYS_IN_MEMORY
    };
}

// 内存清理：将旧数据移到 localStorage
function triggerMemoryCleanup() {
    const totalKeys = allKeysData.length;
    
    if (totalKeys <= MEMORY_LIMITS.KEEP_RECENT_KEYS) {
        return; // 不需要清理
    }
    
    try {
        // 按照完成时间排序，保留最近的密钥
        const sortedKeys = [...allKeysData].sort((a, b) => {
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // 最新的在前
        });
        
        const recentKeys = sortedKeys.slice(0, MEMORY_LIMITS.KEEP_RECENT_KEYS);
        const oldKeys = sortedKeys.slice(MEMORY_LIMITS.KEEP_RECENT_KEYS);
        
        if (oldKeys.length > 0) {
            // 将旧数据存储到 localStorage
            saveOldKeysToStorage(oldKeys);
            
            // 更新内存中的数据
            allKeysData.splice(0, allKeysData.length, ...recentKeys);
            
            console.log(`[MemoryManager] 内存清理完成: 保留 ${recentKeys.length} 个密钥，存储 ${oldKeys.length} 个旧密钥`);
            
            // 触发UI更新
            if (typeof onDataChanged === 'function') {
                onDataChanged();
            }
        }
    } catch (error) {
        console.error('[MemoryManager] 内存清理失败:', error);
        diskStorageEnabled = false; // 禁用磁盘存储
    }
}

// 保存旧密钥到 localStorage
function saveOldKeysToStorage(oldKeys) {
    try {
        // 获取现有的存储数据
        const existingData = getStoredKeys();
        
        // 合并新旧数据
        const combinedData = [...existingData, ...oldKeys];
        
        // 限制存储数量，避免 localStorage 溢出
        const maxStoredKeys = 20000;
        const dataToStore = combinedData.slice(-maxStoredKeys);
        
        // 存储到 localStorage
        const dataStr = JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            keys: dataToStore
        });
        
        localStorage.setItem(MEMORY_LIMITS.STORAGE_KEY, dataStr);
        
        return dataToStore.length;
    } catch (error) {
        console.error('[MemoryManager] 存储失败:', error);
        throw error;
    }
}

// 从 localStorage 获取存储的密钥
function getStoredKeys() {
    try {
        const dataStr = localStorage.getItem(MEMORY_LIMITS.STORAGE_KEY);
        if (!dataStr) return [];
        
        const data = JSON.parse(dataStr);
        if (!data || !data.keys || !Array.isArray(data.keys)) return [];
        
        return data.keys;
    } catch (error) {
        console.error('[MemoryManager] 读取存储失败:', error);
        return [];
    }
}

// 获取所有密钥（内存 + 存储）
function getAllKeysWithStorage() {
    const memoryKeys = allKeysData || [];
    const storedKeys = diskStorageEnabled ? getStoredKeys() : [];
    
    return {
        memoryKeys,
        storedKeys,
        total: memoryKeys.length + storedKeys.length
    };
}

// 搜索密钥（在内存和存储中）
function searchKeys(query, includeStored = true) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // 搜索内存中的密钥
    for (const key of allKeysData) {
        if (key.key.toLowerCase().includes(lowerQuery) || 
            (key.error && key.error.toLowerCase().includes(lowerQuery))) {
            results.push({ ...key, source: 'memory' });
        }
    }
    
    // 搜索存储中的密钥
    if (includeStored && diskStorageEnabled) {
        try {
            const storedKeys = getStoredKeys();
            for (const key of storedKeys) {
                if (key.key.toLowerCase().includes(lowerQuery) || 
                    (key.error && key.error.toLowerCase().includes(lowerQuery))) {
                    results.push({ ...key, source: 'storage' });
                }
            }
        } catch (error) {
            console.error('[MemoryManager] 搜索存储失败:', error);
        }
    }
    
    return results;
}

// 清理所有存储数据
function clearAllStorage() {
    try {
        localStorage.removeItem(MEMORY_LIMITS.STORAGE_KEY);
        console.log('[MemoryManager] 存储数据已清理');
    } catch (error) {
        console.error('[MemoryManager] 清理存储失败:', error);
    }
}

// 获取内存和存储统计
function getMemoryStats() {
    const allKeys = getAllKeysWithStorage();
    const storageSizeKB = diskStorageEnabled ? 
        Math.round((localStorage.getItem(MEMORY_LIMITS.STORAGE_KEY) || '').length / 1024) : 0;
    
    return {
        memoryKeys: allKeys.memoryKeys.length,
        storedKeys: allKeys.storedKeys.length,
        totalKeys: allKeys.total,
        storageSizeKB,
        memoryPressure: allKeys.memoryKeys.length > MEMORY_LIMITS.CLEANUP_THRESHOLD,
        diskStorageEnabled
    };
}

// 周期性内存检查
function startMemoryMonitor() {
    setInterval(() => {
        const stats = checkMemoryPressure();
        if (stats.needsCleanup && diskStorageEnabled) {
            triggerMemoryCleanup();
        }
    }, 30000); // 30秒检查一次
}

// 在测试开始时标记时间戳
function markKeyCompleted(keyData) {
    if (keyData) {
        keyData.completedAt = Date.now();
    }
}

// 批量处理：减少内存分配
function batchProcessKeys(keys, processor, batchSize = 1000) {
    return new Promise((resolve) => {
        let index = 0;
        
        function processBatch() {
            const batch = keys.slice(index, index + batchSize);
            if (batch.length === 0) {
                resolve();
                return;
            }
            
            // 处理当前批次
            for (const key of batch) {
                processor(key);
            }
            
            index += batchSize;
            
            // 使用 setTimeout 让出控制权，避免阻塞UI
            setTimeout(processBatch, 0);
        }
        
        processBatch();
    });
}

// 启动内存监控
if (typeof window !== 'undefined') {
    // 延迟启动，避免影响初始化
    setTimeout(startMemoryMonitor, 5000);
}

try {
    if (typeof window !== 'undefined') {
        window.memoryManager = {
            checkMemoryPressure,
            triggerMemoryCleanup,
            getAllKeysWithStorage,
            searchKeys,
            clearAllStorage,
            getMemoryStats,
            markKeyCompleted,
            batchProcessKeys,
            MEMORY_LIMITS
        };
    }
} catch (_) {}

export { 
    checkMemoryPressure, 
    triggerMemoryCleanup, 
    getAllKeysWithStorage, 
    searchKeys, 
    clearAllStorage, 
    getMemoryStats,
    markKeyCompleted,
    batchProcessKeys,
    MEMORY_LIMITS 
};
