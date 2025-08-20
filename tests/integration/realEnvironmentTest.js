/**
 * 真实环境集成测试
 * 在实际的API密钥测试环境中验证系统稳定性
 */

class RealEnvironmentTest {
    constructor() {
        this.config = {
            // 测试配置
            testKeyCount: 1000,           // 测试密钥数量
            stressKeyCount: 5000,         // 压力测试密钥数量
            maxTestDuration: 300000,      // 最大测试时间 5分钟
            memoryCheckInterval: 2000,    // 内存检查间隔
            
            // 性能阈值
            maxMemoryIncrease: 100 * 1024 * 1024,  // 100MB内存增长上限
            maxAvgResponseTime: 5000,     // 平均响应时间上限 5秒
            minThroughput: 10,            // 最小吞吐量 10 keys/sec
            maxLongTasks: 3,              // 最大长任务数
            
            // UI响应性阈值
            maxUIUpdateDelay: 1000,       // UI更新最大延迟
            maxScrollLag: 100,            // 滚动延迟上限
            virtualListThreshold: 500     // 虚拟列表启用阈值
        };
        
        this.results = {
            tests: [],
            performance: {},
            ui: {},
            memory: {},
            errors: []
        };
        
        this.startTime = null;
        this.originalAllKeysData = [];
        this.performanceObserver = null;
        this.memorySnapshots = [];
        this.uiUpdateTimes = [];
    }
    
    /**
     * 执行完整的真实环境测试
     */
    async runRealEnvironmentTest() {
        console.log('🌍 开始真实环境集成测试');
        this.startTime = Date.now();
        
        try {
            // 保存原始状态
            this.saveOriginalState();
            
            // 设置监控
            this.setupPerformanceMonitoring();
            
            // 1. 验证系统就绪状态
            await this.verifySystemReadiness();
            
            // 2. 测试UI健康度优化
            await this.testUIHealthOptimization();
            
            // 3. 测试存储系统
            await this.testStorageSystem();
            
            // 4. 测试大量数据处理
            await this.testMassiveDataHandling();
            
            // 5. 测试内存管理
            await this.testMemoryManagement();
            
            // 6. 测试实际API调用流程
            await this.testRealAPIFlow();
            
            // 7. 测试错误恢复
            await this.testErrorRecovery();
            
            // 8. 测试长时间运行
            await this.testLongTermRunning();
            
            // 生成报告
            const report = this.generateReport();
            
            console.log('✅ 真实环境测试完成');
            return report;
            
        } catch (error) {
            this.results.errors.push({
                type: 'test_suite_failure',
                message: error.message,
                timestamp: Date.now()
            });
            throw error;
            
        } finally {
            this.cleanup();
        }
    }
    
    /**
     * 保存原始状态
     */
    saveOriginalState() {
        if (typeof allKeysData !== 'undefined') {
            this.originalAllKeysData = [...allKeysData];
        }
    }
    
    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 内存监控
        this.memoryMonitor = setInterval(() => {
            if (performance.memory) {
                this.memorySnapshots.push({
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
            }
        }, this.config.memoryCheckInterval);
        
        // 长任务监控
        if ('PerformanceObserver' in window) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'longtask' && entry.duration > 50) {
                            this.results.performance.longTasks = this.results.performance.longTasks || [];
                            this.results.performance.longTasks.push({
                                duration: entry.duration,
                                startTime: entry.startTime,
                                timestamp: Date.now()
                            });
                        }
                    }
                });
                
                this.performanceObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.warn('Performance observer not available');
            }
        }
    }
    
    /**
     * 1. 验证系统就绪状态
     */
    async verifySystemReadiness() {
        const testName = '系统就绪状态验证';
        console.log(`📋 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            checks: []
        };
        
        try {
            // 检查核心模块
            const requiredModules = [
                'globalConcurrencyManager',
                'uiHealthOptimizer',
                'indexedDBFallback',
                'unifiedFetch'
            ];
            
            for (const module of requiredModules) {
                if (typeof window[module] === 'undefined') {
                    throw new Error(`核心模块 ${module} 未加载`);
                }
                testResult.checks.push(`✅ ${module} 已加载`);
            }
            
            // 检查UI元素
            const requiredElements = [
                'apiKeys', 'apiType', 'testBtn', 'stopBtn',
                'totalCount', 'validCount', 'invalidCount'
            ];
            
            for (const elementId of requiredElements) {
                const element = document.getElementById(elementId);
                if (!element) {
                    throw new Error(`UI元素 ${elementId} 不存在`);
                }
                testResult.checks.push(`✅ UI元素 ${elementId} 存在`);
            }
            
            // 检查核心函数
            const requiredFunctions = [
                'startTesting', 'stopTesting', 'clearAll',
                'updateStats', 'updateKeyLists'
            ];
            
            for (const funcName of requiredFunctions) {
                if (typeof window[funcName] !== 'function') {
                    throw new Error(`核心函数 ${funcName} 不存在`);
                }
                testResult.checks.push(`✅ 函数 ${funcName} 可用`);
            }
            
            testResult.checks.push(`✅ 系统完全就绪`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 2. 测试UI健康度优化
     */
    async testUIHealthOptimization() {
        const testName = 'UI健康度优化测试';
        console.log(`🖱️ 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            const optimizer = window.uiHealthOptimizer;
            if (!optimizer) {
                throw new Error('UI健康度优化器不可用');
            }
            
            // 测试节流功能
            let updateCount = 0;
            const testUpdate = () => updateCount++;
            
            // 快速连续调用，应该被节流
            for (let i = 0; i < 10; i++) {
                optimizer.throttleStatsUpdate(testUpdate);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (updateCount > 3) {
                throw new Error(`节流效果不佳: 期望≤3次，实际${updateCount}次`);
            }
            
            testResult.metrics.throttleEffectiveness = updateCount;
            
            // 测试虚拟列表
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                key: `test-key-${i}`,
                status: 'valid'
            }));
            
            const virtualList = optimizer.createVirtualList(
                'testVirtualContainer',
                largeDataset,
                (item) => {
                    const div = document.createElement('div');
                    div.textContent = item.key;
                    return div;
                }
            );
            
            if (!virtualList) {
                throw new Error('虚拟列表创建失败');
            }
            
            // 测试滚动性能
            const scrollStartTime = performance.now();
            if (virtualList.container) {
                virtualList.container.scrollTop = 5000;
                await new Promise(resolve => setTimeout(resolve, 100));
                virtualList.container.scrollTop = 0;
            }
            const scrollEndTime = performance.now();
            
            testResult.metrics.scrollPerformance = scrollEndTime - scrollStartTime;
            
            // 测试批处理
            const batchData = Array.from({ length: 500 }, (_, i) => `batch-item-${i}`);
            const batchStartTime = performance.now();
            
            const batchResult = await optimizer.processBatch(
                'ui-test-batch',
                batchData,
                async (item) => ({ processed: item }),
                { batchSize: 50, maxBatchTime: 10 }
            );
            
            const batchEndTime = performance.now();
            
            if (batchResult.length !== batchData.length) {
                throw new Error(`批处理数量不匹配: ${batchResult.length}/${batchData.length}`);
            }
            
            testResult.metrics.batchProcessingTime = batchEndTime - batchStartTime;
            testResult.metrics.batchThroughput = batchData.length / ((batchEndTime - batchStartTime) / 1000);
            
            // 获取健康度指标
            const healthMetrics = optimizer.getHealthMetrics();
            testResult.metrics.healthMetrics = healthMetrics;
            
            console.log(`✅ UI优化测试完成: 节流${updateCount}次, 批处理${testResult.metrics.batchThroughput.toFixed(1)} items/s`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 3. 测试存储系统
     */
    async testStorageSystem() {
        const testName = '存储系统测试';
        console.log(`💾 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            const storage = window.indexedDBFallback;
            if (!storage) {
                throw new Error('存储系统不可用');
            }
            
            // 测试基本存储操作
            const testData = {
                key: 'storage-test-key',
                status: 'valid',
                timestamp: Date.now(),
                data: 'x'.repeat(1000) // 1KB数据
            };
            
            const storageStartTime = performance.now();
            await storage.set('test-key', testData);
            const retrievedData = await storage.get('test-key');
            const storageEndTime = performance.now();
            
            if (!retrievedData || retrievedData.key !== testData.key) {
                throw new Error('基本存储操作失败');
            }
            
            testResult.metrics.basicOperationTime = storageEndTime - storageStartTime;
            
            // 测试批量存储
            const batchData = Array.from({ length: 100 }, (_, i) => ({
                key: `batch-test-${i}`,
                value: { index: i, data: 'test'.repeat(10) },
                options: { ttl: 3600000 }
            }));
            
            const batchStartTime = performance.now();
            const batchResults = await storage.setBatch(batchData);
            const batchEndTime = performance.now();
            
            const successCount = batchResults.filter(r => r.success).length;
            if (successCount < batchData.length * 0.9) {
                throw new Error(`批量存储成功率过低: ${successCount}/${batchData.length}`);
            }
            
            testResult.metrics.batchStorageTime = batchEndTime - batchStartTime;
            testResult.metrics.batchStorageRate = successCount / ((batchEndTime - batchStartTime) / 1000);
            
            // 测试存储统计
            const stats = await storage.getStats();
            testResult.metrics.storageStats = stats;
            
            // 清理测试数据
            await storage.cleanup();
            
            console.log(`✅ 存储测试完成: 批量存储${testResult.metrics.batchStorageRate.toFixed(1)} items/s`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 4. 测试大量数据处理
     */
    async testMassiveDataHandling() {
        const testName = '大量数据处理测试';
        console.log(`📊 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            // 清空现有数据
            if (typeof clearAll === 'function') {
                clearAll();
            }
            
            // 生成大量测试数据
            const massiveData = Array.from({ length: this.config.testKeyCount }, (_, i) => ({
                key: `massive-test-key-${i}-${'x'.repeat(20)}`,
                status: 'pending',
                timestamp: Date.now(),
                retryCount: 0
            }));
            
            const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const processingStartTime = performance.now();
            
            // 将数据注入到系统中
            if (typeof allKeysData !== 'undefined') {
                allKeysData.push(...massiveData);
            }
            
            // 触发UI更新
            const uiUpdateStart = performance.now();
            if (typeof updateStats === 'function') {
                updateStats();
            }
            if (typeof updateKeyLists === 'function') {
                updateKeyLists();
            }
            const uiUpdateEnd = performance.now();
            
            const processingEndTime = performance.now();
            const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // 检查UI更新时间
            const uiUpdateTime = uiUpdateEnd - uiUpdateStart;
            if (uiUpdateTime > this.config.maxUIUpdateDelay) {
                throw new Error(`UI更新时间过长: ${uiUpdateTime.toFixed(1)}ms`);
            }
            
            // 检查内存使用
            const memoryIncrease = memoryAfter - memoryBefore;
            if (memoryIncrease > this.config.maxMemoryIncrease) {
                throw new Error(`内存增长过多: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);
            }
            
            testResult.metrics = {
                dataCount: massiveData.length,
                processingTime: processingEndTime - processingStartTime,
                uiUpdateTime: uiUpdateTime,
                memoryIncrease: memoryIncrease,
                memoryIncreaseMB: memoryIncrease / 1024 / 1024,
                throughput: massiveData.length / ((processingEndTime - processingStartTime) / 1000)
            };
            
            console.log(`✅ 大量数据测试完成: ${massiveData.length}项, UI更新${uiUpdateTime.toFixed(1)}ms`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 5. 测试内存管理
     */
    async testMemoryManagement() {
        const testName = '内存管理测试';
        console.log(`🧠 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            if (!performance.memory) {
                testResult.passed = false;
                testResult.error = 'performance.memory 不可用';
                testResult.duration = Date.now() - testResult.startTime;
                this.results.tests.push(testResult);
                return;
            }
            
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // 创建大量数据以测试内存管理
            const memoryTestData = Array.from({ length: 5000 }, (_, i) => ({
                id: i,
                key: `memory-test-${i}`,
                data: 'x'.repeat(500), // 500字节
                largeObject: {
                    array: new Array(100).fill(Math.random()),
                    nested: { deep: { data: 'test'.repeat(50) } }
                }
            }));
            
            // 添加到全局数据
            if (typeof allKeysData !== 'undefined') {
                const originalLength = allKeysData.length;
                allKeysData.push(...memoryTestData);
                
                // 触发UI更新（这会使用内存）
                if (typeof updateStats === 'function') updateStats();
                if (typeof updateKeyLists === 'function') updateKeyLists();
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const peakMemory = performance.memory.usedJSHeapSize;
                const memoryIncrease = peakMemory - initialMemory;
                
                // 清理数据
                allKeysData.splice(originalLength);
                
                // 触发清理
                if (typeof uiHealthOptimizer !== 'undefined') {
                    uiHealthOptimizer.triggerMemoryCleanup();
                }
                
                // 强制垃圾回收（如果可用）
                if (window.gc) window.gc();
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const finalMemory = performance.memory.usedJSHeapSize;
                const memoryRecovered = peakMemory - finalMemory;
                const recoveryRate = memoryRecovered / memoryIncrease;
                
                testResult.metrics = {
                    initialMemory: initialMemory,
                    peakMemory: peakMemory,
                    finalMemory: finalMemory,
                    memoryIncrease: memoryIncrease,
                    memoryIncreaseKB: memoryIncrease / 1024,
                    memoryRecovered: memoryRecovered,
                    memoryRecoveredKB: memoryRecovered / 1024,
                    recoveryRate: recoveryRate,
                    testDataSize: memoryTestData.length
                };
                
                // 验证内存恢复
                if (recoveryRate < 0.5) {
                    throw new Error(`内存恢复率过低: ${(recoveryRate * 100).toFixed(1)}%`);
                }
                
                if (memoryIncrease > this.config.maxMemoryIncrease) {
                    throw new Error(`内存增长过多: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);
                }
                
                console.log(`✅ 内存管理测试完成: 恢复率${(recoveryRate * 100).toFixed(1)}%`);
            }
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 6. 测试实际API调用流程
     */
    async testRealAPIFlow() {
        const testName = '实际API调用流程测试';
        console.log(`🌐 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            // 清空现有数据
            if (typeof clearAll === 'function') {
                clearAll();
            }
            
            // 注入少量真实格式的测试密钥（但是无效的）
            const testKeys = [
                'sk-test1234567890abcdef' + 'x'.repeat(30),
                'cl-test1234567890abcdef' + 'x'.repeat(30),
                'AIzaSyTest1234567890abcdef' + 'x'.repeat(20)
            ];
            
            const apiKeysInput = document.getElementById('apiKeys');
            if (apiKeysInput) {
                apiKeysInput.value = testKeys.join('\n');
            }
            
            // 记录并发管理器状态
            const concurrencyManager = window.globalConcurrencyManager;
            const initialConcurrency = concurrencyManager ? concurrencyManager.maxGlobalConcurrency : 0;
            
            // 启动测试
            const flowStartTime = performance.now();
            const testBtn = document.getElementById('testBtn');
            
            if (testBtn && !testBtn.disabled) {
                testBtn.click();
                
                // 等待测试开始
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 监控测试状态
                let testCompleted = false;
                let waitTime = 0;
                const maxWaitTime = 30000; // 30秒超时
                
                while (!testCompleted && waitTime < maxWaitTime) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    waitTime += 1000;
                    
                    // 检查测试是否完成（测试按钮重新启用）
                    if (!testBtn.disabled) {
                        testCompleted = true;
                        break;
                    }
                }
                
                const flowEndTime = performance.now();
                
                if (!testCompleted) {
                    throw new Error('API流程测试超时');
                }
                
                // 获取测试结果
                const stats = {
                    total: parseInt(document.getElementById('totalCount')?.textContent || '0'),
                    valid: parseInt(document.getElementById('validCount')?.textContent || '0'),
                    invalid: parseInt(document.getElementById('invalidCount')?.textContent || '0'),
                    rateLimited: parseInt(document.getElementById('rateLimitedCount')?.textContent || '0')
                };
                
                testResult.metrics = {
                    testDuration: flowEndTime - flowStartTime,
                    testKeys: testKeys.length,
                    results: stats,
                    initialConcurrency: initialConcurrency,
                    finalConcurrency: concurrencyManager ? concurrencyManager.maxGlobalConcurrency : 0,
                    processingRate: stats.total / ((flowEndTime - flowStartTime) / 1000)
                };
                
                // 验证基本功能
                if (stats.total !== testKeys.length) {
                    throw new Error(`处理密钥数量不匹配: ${stats.total}/${testKeys.length}`);
                }
                
                console.log(`✅ API流程测试完成: ${stats.total}个密钥, 耗时${(testResult.metrics.testDuration / 1000).toFixed(1)}s`);
                
            } else {
                throw new Error('无法启动API测试（测试按钮不可用）');
            }
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 7. 测试错误恢复
     */
    async testErrorRecovery() {
        const testName = '错误恢复测试';
        console.log(`🔄 执行 ${testName}...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            // 测试停止功能
            if (typeof clearAll === 'function') {
                clearAll();
            }
            
            const testKeys = Array.from({ length: 50 }, (_, i) => `test-key-${i}${'x'.repeat(30)}`);
            const apiKeysInput = document.getElementById('apiKeys');
            if (apiKeysInput) {
                apiKeysInput.value = testKeys.join('\n');
            }
            
            // 启动测试
            const testBtn = document.getElementById('testBtn');
            const stopBtn = document.getElementById('stopBtn');
            
            if (testBtn && !testBtn.disabled) {
                testBtn.click();
                
                // 等待1秒后停止测试
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (stopBtn && !stopBtn.disabled) {
                    stopBtn.click();
                    testResult.metrics.stopFunctionality = true;
                } else {
                    testResult.metrics.stopFunctionality = false;
                }
                
                // 等待停止完成
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 验证测试确实停止了
                const stats = {
                    total: parseInt(document.getElementById('totalCount')?.textContent || '0')
                };
                
                testResult.metrics.processedBeforeStop = stats.total;
                testResult.metrics.expectedTotal = testKeys.length;
                
                // 测试清除功能
                if (typeof clearAll === 'function') {
                    clearAll();
                    
                    const clearedStats = {
                        total: parseInt(document.getElementById('totalCount')?.textContent || '0')
                    };
                    
                    if (clearedStats.total !== 0) {
                        throw new Error(`清除功能失效: 仍有${clearedStats.total}个项目`);
                    }
                    
                    testResult.metrics.clearFunctionality = true;
                }
                
                console.log(`✅ 错误恢复测试完成: 停止功能正常, 清除功能正常`);
                
            } else {
                throw new Error('无法启动错误恢复测试');
            }
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 8. 测试长时间运行
     */
    async testLongTermRunning() {
        const testName = '长时间运行测试';
        console.log(`⏰ 执行 ${testName} (30秒持续操作)...`);
        
        const testResult = {
            name: testName,
            passed: true,
            startTime: Date.now(),
            metrics: {}
        };
        
        try {
            const runDuration = 30000; // 30秒
            const operationInterval = 2000; // 2秒间隔
            const operations = runDuration / operationInterval;
            
            const stabilityMetrics = {
                memorySnapshots: [],
                operationTimes: [],
                uiResponseTimes: [],
                errorCounts: 0
            };
            
            for (let i = 0; i < operations; i++) {
                const operationStart = performance.now();
                
                try {
                    // 执行一次小规模操作
                    if (typeof clearAll === 'function') {
                        clearAll();
                    }
                    
                    const miniKeys = Array.from({ length: 10 }, (_, j) => `long-test-${i}-${j}`);
                    
                    if (typeof allKeysData !== 'undefined') {
                        allKeysData.push(...miniKeys.map(key => ({ key, status: 'pending' })));
                    }
                    
                    // 测试UI响应
                    const uiStart = performance.now();
                    if (typeof updateStats === 'function') {
                        updateStats();
                    }
                    const uiEnd = performance.now();
                    
                    stabilityMetrics.uiResponseTimes.push(uiEnd - uiStart);
                    
                    // 记录内存状态
                    if (performance.memory) {
                        stabilityMetrics.memorySnapshots.push({
                            operation: i,
                            timestamp: Date.now(),
                            memory: performance.memory.usedJSHeapSize / 1024 / 1024
                        });
                    }
                    
                } catch (opError) {
                    stabilityMetrics.errorCounts++;
                    console.warn(`长期运行操作 ${i} 出错:`, opError.message);
                }
                
                const operationEnd = performance.now();
                stabilityMetrics.operationTimes.push(operationEnd - operationStart);
                
                // 等待下次操作
                await new Promise(resolve => setTimeout(resolve, operationInterval));
            }
            
            // 分析稳定性
            const avgOperationTime = stabilityMetrics.operationTimes.reduce((a, b) => a + b, 0) / stabilityMetrics.operationTimes.length;
            const avgUIResponse = stabilityMetrics.uiResponseTimes.reduce((a, b) => a + b, 0) / stabilityMetrics.uiResponseTimes.length;
            
            // 分析内存趋势
            const memoryTrend = this.analyzeMemoryTrend(stabilityMetrics.memorySnapshots);
            
            testResult.metrics = {
                totalOperations: operations,
                errorCount: stabilityMetrics.errorCounts,
                avgOperationTime: avgOperationTime,
                avgUIResponse: avgUIResponse,
                memoryTrend: memoryTrend,
                stabilityScore: (operations - stabilityMetrics.errorCounts) / operations
            };
            
            // 验证稳定性
            if (stabilityMetrics.errorCounts > operations * 0.1) {
                throw new Error(`错误率过高: ${stabilityMetrics.errorCounts}/${operations}`);
            }
            
            if (avgUIResponse > this.config.maxUIUpdateDelay) {
                throw new Error(`UI响应时间过长: ${avgUIResponse.toFixed(1)}ms`);
            }
            
            if (memoryTrend.trend === 'increasing' && memoryTrend.rate > 2.0) {
                throw new Error(`内存泄漏风险: 增长率${memoryTrend.rate.toFixed(2)}MB/min`);
            }
            
            console.log(`✅ 长时间运行测试完成: ${operations}次操作, 稳定性${(testResult.metrics.stabilityScore * 100).toFixed(1)}%`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error.message;
        }
        
        testResult.duration = Date.now() - testResult.startTime;
        this.results.tests.push(testResult);
    }
    
    /**
     * 分析内存趋势
     */
    analyzeMemoryTrend(snapshots) {
        if (snapshots.length < 2) {
            return { trend: 'insufficient_data', rate: 0 };
        }
        
        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60; // 分钟
        const memoryDiff = last.memory - first.memory;
        const rate = memoryDiff / timeDiff;
        
        return {
            trend: rate > 1.0 ? 'increasing' : rate < -1.0 ? 'decreasing' : 'stable',
            rate: rate,
            totalChange: memoryDiff,
            duration: timeDiff,
            snapshots: snapshots.length
        };
    }
    
    /**
     * 生成测试报告
     */
    generateReport() {
        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;
        
        const passedTests = this.results.tests.filter(t => t.passed).length;
        const totalTests = this.results.tests.length;
        const successRate = passedTests / totalTests;
        
        // 计算性能指标
        const performanceMetrics = this.calculatePerformanceMetrics();
        const memoryMetrics = this.calculateMemoryMetrics();
        
        // 生成生产就绪判决
        const verdict = this.generateProductionVerdict(successRate, performanceMetrics, memoryMetrics);
        
        return {
            summary: {
                testType: 'real_environment_integration',
                totalDuration: totalDuration,
                totalTests: totalTests,
                passedTests: passedTests,
                successRate: successRate,
                verdict: verdict
            },
            performance: performanceMetrics,
            memory: memoryMetrics,
            tests: this.results.tests,
            errors: this.results.errors,
            recommendations: this.generateRecommendations(verdict, performanceMetrics, memoryMetrics)
        };
    }
    
    calculatePerformanceMetrics() {
        const longTasks = this.results.performance.longTasks || [];
        const totalLongTasks = longTasks.length;
        const avgLongTaskDuration = totalLongTasks > 0 ? 
            longTasks.reduce((sum, task) => sum + task.duration, 0) / totalLongTasks : 0;
        
        return {
            totalLongTasks: totalLongTasks,
            avgLongTaskDuration: avgLongTaskDuration,
            longTasksExceedsThreshold: totalLongTasks > this.config.maxLongTasks,
            uiUpdateTimes: this.uiUpdateTimes,
            avgUIUpdateTime: this.uiUpdateTimes.length > 0 ? 
                this.uiUpdateTimes.reduce((a, b) => a + b, 0) / this.uiUpdateTimes.length : 0
        };
    }
    
    calculateMemoryMetrics() {
        if (this.memorySnapshots.length === 0) {
            return { available: false };
        }
        
        const memories = this.memorySnapshots.map(s => s.used);
        const peakMemory = Math.max(...memories);
        const avgMemory = memories.reduce((a, b) => a + b, 0) / memories.length;
        const memoryGrowth = memories[memories.length - 1] - memories[0];
        
        return {
            available: true,
            peakMemoryMB: peakMemory / 1024 / 1024,
            avgMemoryMB: avgMemory / 1024 / 1024,
            memoryGrowthMB: memoryGrowth / 1024 / 1024,
            memoryGrowthRate: memoryGrowth / (this.memorySnapshots.length * this.config.memoryCheckInterval / 1000 / 60), // MB/min
            snapshots: this.memorySnapshots.length
        };
    }
    
    generateProductionVerdict(successRate, performanceMetrics, memoryMetrics) {
        const issues = [];
        const warnings = [];
        
        // 检查基本成功率
        if (successRate < 0.8) {
            issues.push(`测试成功率过低: ${(successRate * 100).toFixed(1)}%`);
        } else if (successRate < 0.95) {
            warnings.push(`测试成功率偏低: ${(successRate * 100).toFixed(1)}%`);
        }
        
        // 检查性能指标
        if (performanceMetrics.longTasksExceedsThreshold) {
            issues.push(`长任务过多: ${performanceMetrics.totalLongTasks} > ${this.config.maxLongTasks}`);
        }
        
        if (performanceMetrics.avgUIUpdateTime > this.config.maxUIUpdateDelay) {
            warnings.push(`UI更新延迟: ${performanceMetrics.avgUIUpdateTime.toFixed(1)}ms`);
        }
        
        // 检查内存指标
        if (memoryMetrics.available) {
            if (memoryMetrics.memoryGrowthRate > 5.0) {
                issues.push(`内存增长率过高: ${memoryMetrics.memoryGrowthRate.toFixed(1)}MB/min`);
            } else if (memoryMetrics.memoryGrowthRate > 2.0) {
                warnings.push(`内存增长率偏高: ${memoryMetrics.memoryGrowthRate.toFixed(1)}MB/min`);
            }
            
            if (memoryMetrics.peakMemoryMB > 200) {
                warnings.push(`内存峰值较高: ${memoryMetrics.peakMemoryMB.toFixed(1)}MB`);
            }
        }
        
        // 生成最终判决
        if (issues.length > 0) {
            return {
                status: 'NOT_READY',
                level: 'error',
                message: '系统未通过生产环境测试',
                issues: issues,
                warnings: warnings
            };
        }
        
        if (warnings.length > 3) {
            return {
                status: 'CONDITIONAL',
                level: 'warning',
                message: '系统基本满足要求，但需要关注性能问题',
                issues: issues,
                warnings: warnings
            };
        }
        
        if (warnings.length > 0) {
            return {
                status: 'READY_WITH_MONITORING',
                level: 'info',
                message: '系统准备就绪，建议监控性能指标',
                issues: issues,
                warnings: warnings
            };
        }
        
        return {
            status: 'PRODUCTION_READY',
            level: 'success',
            message: '系统完全满足生产环境要求',
            issues: issues,
            warnings: warnings
        };
    }
    
    generateRecommendations(verdict, performanceMetrics, memoryMetrics) {
        const recommendations = [];
        
        switch (verdict.status) {
            case 'NOT_READY':
                recommendations.push('🔴 立即修复所有关键问题后重新测试');
                recommendations.push('🔍 建议逐一分析失败的测试用例');
                break;
                
            case 'CONDITIONAL':
                recommendations.push('🟡 优化性能警告后可部署到测试环境');
                recommendations.push('📊 增加生产环境监控指标');
                break;
                
            case 'READY_WITH_MONITORING':
                recommendations.push('🟢 可以部署到生产环境');
                recommendations.push('📈 启用内存和性能监控');
                recommendations.push('⚡ 设置性能警告阈值');
                break;
                
            case 'PRODUCTION_READY':
                recommendations.push('🏆 系统性能优秀，可安全部署');
                recommendations.push('🎯 可以考虑处理更大规模的数据');
                break;
        }
        
        // 性能特定建议
        if (performanceMetrics.totalLongTasks > 0) {
            recommendations.push('⚡ 考虑进一步优化长任务拆分');
        }
        
        if (memoryMetrics.available && memoryMetrics.memoryGrowthRate > 1.0) {
            recommendations.push('🧠 建议增加内存清理频率');
        }
        
        return recommendations;
    }
    
    /**
     * 清理测试环境
     */
    cleanup() {
        // 恢复原始数据
        if (typeof allKeysData !== 'undefined') {
            allKeysData.length = 0;
            allKeysData.push(...this.originalAllKeysData);
        }
        
        // 清理监控器
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        // 更新UI状态
        if (typeof updateStats === 'function') {
            updateStats();
        }
        if (typeof updateKeyLists === 'function') {
            updateKeyLists();
        }
        
        console.log('🧹 真实环境测试清理完成');
    }
}

// 导出测试类
if (typeof window !== 'undefined') {
    window.RealEnvironmentTest = RealEnvironmentTest;
}

export default RealEnvironmentTest;
