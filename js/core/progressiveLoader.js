// 渐进式加载器 - 分批处理大量密钥，避免浏览器卡顿

const PROGRESSIVE_LIMITS = {
    INITIAL_BATCH_SIZE: 500,        // 首批加载数量
    BATCH_SIZE: 200,                // 后续批次大小
    BATCH_DELAY: 100,               // 批次间延迟(ms)
    MAX_CONCURRENT_BATCHES: 3,      // 最大并发批次数
    UI_UPDATE_INTERVAL: 50          // UI更新间隔(ms)
};

class ProgressiveLoader {
    constructor() {
        this.isLoading = false;
        this.currentBatch = 0;
        this.totalBatches = 0;
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onProgress = null;
        this.onComplete = null;
        this.onBatchComplete = null;
    }
    
    // 分批加载密钥
    async loadKeysProgressively(keys, processor) {
        if (this.isLoading) {
            throw new Error('已有加载任务正在进行');
        }
        
        this.isLoading = true;
        this.totalCount = keys.length;
        this.loadedCount = 0;
        this.currentBatch = 0;
        
        try {
            // 如果密钥数量较少，直接处理
            if (keys.length <= PROGRESSIVE_LIMITS.INITIAL_BATCH_SIZE) {
                await this.processBatch(keys, processor);
                this.onComplete?.(keys.length);
                return;
            }
            
            // 分批处理
            const batches = this.createBatches(keys);
            this.totalBatches = batches.length;
            
            console.log(`[ProgressiveLoader] 开始渐进式加载: ${keys.length} 个密钥，分 ${batches.length} 批处理`);
            
            // 并发处理批次
            await this.processBatchesConcurrently(batches, processor);
            
            this.onComplete?.(this.loadedCount);
            console.log(`[ProgressiveLoader] 加载完成: ${this.loadedCount} 个密钥`);
            
        } finally {
            this.isLoading = false;
        }
    }
    
    // 创建批次
    createBatches(keys) {
        const batches = [];
        let index = 0;
        
        // 首批使用较大的批次大小
        if (keys.length > PROGRESSIVE_LIMITS.INITIAL_BATCH_SIZE) {
            batches.push(keys.slice(0, PROGRESSIVE_LIMITS.INITIAL_BATCH_SIZE));
            index = PROGRESSIVE_LIMITS.INITIAL_BATCH_SIZE;
        }
        
        // 后续批次
        while (index < keys.length) {
            const batchEnd = Math.min(index + PROGRESSIVE_LIMITS.BATCH_SIZE, keys.length);
            batches.push(keys.slice(index, batchEnd));
            index = batchEnd;
        }
        
        return batches;
    }
    
    // 并发处理批次
    async processBatchesConcurrently(batches, processor) {
        const activeBatches = [];
        let batchIndex = 0;
        
        // 启动初始批次
        for (let i = 0; i < Math.min(PROGRESSIVE_LIMITS.MAX_CONCURRENT_BATCHES, batches.length); i++) {
            activeBatches.push(this.processBatchWithDelay(batches[batchIndex], processor, batchIndex));
            batchIndex++;
        }
        
        // 等待批次完成并启动新批次
        while (activeBatches.length > 0) {
            const completed = await Promise.race(activeBatches);
            const completedIndex = activeBatches.indexOf(completed);
            activeBatches.splice(completedIndex, 1);
            
            // 启动下一个批次
            if (batchIndex < batches.length) {
                activeBatches.push(
                    this.processBatchWithDelay(batches[batchIndex], processor, batchIndex)
                );
                batchIndex++;
            }
        }
    }
    
    // 带延迟的批次处理
    async processBatchWithDelay(batch, processor, batchNum) {
        // 首批无延迟，后续批次有延迟
        if (batchNum > 0) {
            await new Promise(resolve => setTimeout(resolve, PROGRESSIVE_LIMITS.BATCH_DELAY));
        }
        
        await this.processBatch(batch, processor);
        this.currentBatch++;
        
        this.onBatchComplete?.(this.currentBatch, this.totalBatches, batch.length);
        
        return Promise.resolve();
    }
    
    // 处理单个批次
    async processBatch(batch, processor) {
        const startTime = Date.now();
        
        // 使用 requestAnimationFrame 确保不阻塞渲染
        await new Promise(resolve => {
            const processItems = (index = 0) => {
                const endTime = Date.now() + 16; // 每16ms处理一轮，保持60fps
                
                while (index < batch.length && Date.now() < endTime) {
                    processor(batch[index]);
                    index++;
                    this.loadedCount++;
                }
                
                this.onProgress?.(this.loadedCount, this.totalCount);
                
                if (index < batch.length) {
                    requestAnimationFrame(() => processItems(index));
                } else {
                    resolve();
                }
            };
            
            processItems();
        });
        
        const duration = Date.now() - startTime;
        console.debug(`[ProgressiveLoader] 批次 ${this.currentBatch + 1} 完成: ${batch.length} 项，耗时 ${duration}ms`);
    }
    
    // 设置进度回调
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
    
    // 设置完成回调
    setCompleteCallback(callback) {
        this.onComplete = callback;
    }
    
    // 设置批次完成回调
    setBatchCompleteCallback(callback) {
        this.onBatchComplete = callback;
    }
    
    // 获取进度
    getProgress() {
        return {
            loaded: this.loadedCount,
            total: this.totalCount,
            percentage: this.totalCount > 0 ? Math.round((this.loadedCount / this.totalCount) * 100) : 0,
            currentBatch: this.currentBatch,
            totalBatches: this.totalBatches,
            isLoading: this.isLoading
        };
    }
    
    // 停止加载
    stop() {
        this.isLoading = false;
        console.log('[ProgressiveLoader] 加载已停止');
    }
}

// 全局渐进式加载器实例
const globalLoader = new ProgressiveLoader();

// 渐进式初始化密钥数据
async function initializeKeysProgressively(rawKeys, apiType, selectedModel) {
    const processor = (rawKey) => {
        const keyData = {
            key: rawKey.trim(),
            status: 'pending',
            error: null,
            type: apiType,
            model: selectedModel,
            retryCount: 0,
            createdAt: Date.now()
        };
        allKeysData.push(keyData);
    };
    
    // 设置进度回调
    globalLoader.setProgressCallback((loaded, total) => {
        if (typeof updateProgress === 'function') {
            const percentage = Math.round((loaded / total) * 100);
            updateProgress(percentage, `初始化密钥: ${loaded}/${total}`);
        }
    });
    
    globalLoader.setBatchCompleteCallback((current, total, batchSize) => {
        console.debug(`[KeyInit] 批次 ${current}/${total} 完成，处理 ${batchSize} 个密钥`);
        
        // 每完成一个批次就更新UI
        if (typeof onDataChanged === 'function') {
            onDataChanged();
        }
    });
    
    await globalLoader.loadKeysProgressively(rawKeys, processor);
    
    console.log(`[KeyInit] 密钥初始化完成: ${allKeysData.length} 个`);
}

// 渐进式UI更新
async function updateUIProgressively() {
    if (allKeysData.length < 1000) {
        // 数据量小，直接更新
        if (typeof updateStatsOptimized === 'function') {
            updateStatsOptimized();
        }
        if (typeof updateKeyListsOptimized === 'function') {
            updateKeyListsOptimized();
        }
        return;
    }
    
    // 大数据量，分批更新
    console.log('[ProgressiveLoader] 开始渐进式UI更新');
    
    // 先更新统计（快速操作）
    if (typeof updateStatsOptimized === 'function') {
        updateStatsOptimized();
    }
    
    // 延迟更新列表（避免阻塞）
    setTimeout(() => {
        if (typeof updateKeyListsOptimized === 'function') {
            updateKeyListsOptimized();
        }
    }, 50);
}

// 性能监控
function createPerformanceMonitor() {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    
    function measureFrame() {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        frameCount++;
        if (frameCount % 60 === 0) { // 每60帧计算一次FPS
            fps = Math.round(1000 / deltaTime);
            if (fps < 30) {
                console.warn(`[PerformanceMonitor] FPS降低: ${fps}, 建议优化性能`);
            }
        }
        
        requestAnimationFrame(measureFrame);
    }
    
    measureFrame();
    
    return {
        getFPS: () => fps,
        getFrameTime: () => performance.now() - lastFrameTime
    };
}

// 启动性能监控（仅在开发模式）
let performanceMonitor = null;
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    performanceMonitor = createPerformanceMonitor();
}

try {
    if (typeof window !== 'undefined') {
        window.ProgressiveLoader = ProgressiveLoader;
        window.globalLoader = globalLoader;
        window.initializeKeysProgressively = initializeKeysProgressively;
        window.updateUIProgressively = updateUIProgressively;
        window.performanceMonitor = performanceMonitor;
    }
} catch (_) {}

export { 
    ProgressiveLoader, 
    globalLoader, 
    initializeKeysProgressively, 
    updateUIProgressively,
    PROGRESSIVE_LIMITS 
};
