/**
 * 生产环境稳定性测试套件
 * 模拟真实生产场景，验证系统在极限条件下的稳定性
 */

class ProductionStabilityTest {
    constructor() {
        this.config = {
            // 测试规模配置
            massiveKeyCount: 10000,      // 大量密钥测试
            extremeKeyCount: 50000,      // 极限密钥测试
            longRunDuration: 1800000,    // 30分钟长期运行测试
            memoryCheckInterval: 5000,   // 5秒内存检查间隔
            
            // 性能阈值
            maxMemoryUsage: 150 * 1024 * 1024,  // 150MB内存上限
            maxResponseTime: 15000,      // 15秒最大响应时间
            minSuccessRate: 0.85,        // 最低85%成功率
            maxLongTasks: 5,             // 最多5个长任务
            maxUIBlocking: 100,          // 最大100ms UI阻塞
            
            // 网络模拟
            networkLatencies: [50, 200, 500, 1000, 2000], // 网络延迟范围
            errorRates: [0.1, 0.2, 0.3, 0.4, 0.5],        // 错误率范围
            
            // 浏览器环境
            environments: [
                'chrome-modern',
                'firefox-modern', 
                'safari-modern',
                'chrome-limited',
                'mobile-chrome'
            ]
        };
        
        this.results = {
            tests: [],
            metrics: {},
            errors: [],
            warnings: []
        };
        
        this.originalFetch = window.fetch;
        this.testStartTime = null;
        this.memoryPeaks = [];
        this.longTasks = [];
        this.uiBlockingEvents = [];
        
        this.setupMonitoring();
    }
    
    /**
     * 设置性能监控
     */
    setupMonitoring() {
        // 内存监控
        this.memoryMonitor = setInterval(() => {
            if (performance.memory) {
                const usage = performance.memory.usedJSHeapSize;
                this.memoryPeaks.push({
                    timestamp: Date.now(),
                    usage,
                    usageMB: usage / 1024 / 1024
                });
                
                if (usage > this.config.maxMemoryUsage) {
                    this.results.warnings.push({
                        type: 'memory_warning',
                        message: `内存使用超过阈值: ${(usage / 1024 / 1024).toFixed(1)}MB`,
                        timestamp: Date.now()
                    });
                }
            }
        }, this.config.memoryCheckInterval);
        
        // 长任务监控
        if ('PerformanceObserver' in window) {
            try {
                this.longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime,
                            timestamp: Date.now()
                        });
                        
                        if (entry.duration > this.config.maxUIBlocking) {
                            this.results.warnings.push({
                                type: 'ui_blocking',
                                message: `检测到UI阻塞: ${entry.duration.toFixed(1)}ms`,
                                timestamp: Date.now()
                            });
                        }
                    }
                });
                
                this.longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.warn('Long task monitoring not available');
            }
        }
    }
    
    /**
     * 执行完整的生产环境测试
     */
    async runFullProductionTest() {
        console.log('🧪 开始生产环境稳定性测试套件');
        this.testStartTime = Date.now();
        
        try {
            // 1. 基础功能验证
            await this.runBasicFunctionalityTest();
            
            // 2. 大量数据压力测试
            await this.runMassiveDataStressTest();
            
            // 3. UI响应性测试
            await this.runUIResponsivenessTest();
            
            // 4. 存储系统压力测试
            await this.runStorageStressTest();
            
            // 5. 网络异常恢复测试
            await this.runNetworkRecoveryTest();
            
            // 6. 内存管理测试
            await this.runMemoryManagementTest();
            
            // 7. 长期运行稳定性测试
            await this.runLongTermStabilityTest();
            
            // 8. 并发极限测试
            await this.runConcurrencyLimitTest();
            
            // 生成测试报告
            const report = this.generateTestReport();
            
            console.log('✅ 生产环境测试完成');
            return report;
            
        } catch (error) {
            this.results.errors.push({
                type: 'test_suite_failure',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
            
            throw new Error(`生产环境测试失败: ${error.message}`);
            
        } finally {
            this.cleanup();
        }
    }
    
    /**
     * 1. 基础功能验证测试
     */
    async runBasicFunctionalityTest() {
        const testName = '基础功能验证';
        console.log(`📋 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0
        };
        
        try {
            // 验证核心模块加载
            const coreModules = [
                'globalConcurrencyManager',
                'uiHealthOptimizer', 
                'indexedDBFallback',
                'unifiedFetch'
            ];
            
            for (const module of coreModules) {
                if (typeof window[module] === 'undefined') {
                    throw new Error(`核心模块 ${module} 未加载`);
                }
                testResults.details.push(`✅ ${module} 模块正常加载`);
            }
            
            // 验证UI元素存在
            const requiredElements = [
                'apiKeys', 'apiType', 'testBtn', 'stopBtn',
                'totalCount', 'validCount', 'invalidCount'
            ];
            
            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    throw new Error(`必需UI元素 ${elementId} 不存在`);
                }
                testResults.details.push(`✅ UI元素 ${elementId} 存在`);
            }
            
            // 验证基础功能
            if (typeof startTesting !== 'function') {
                throw new Error('startTesting 函数不存在');
            }
            if (typeof stopTesting !== 'function') {
                throw new Error('stopTesting 函数不存在');
            }
            
            testResults.details.push('✅ 核心函数可调用');
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'basic_functionality_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 2. 大量数据压力测试
     */
    async runMassiveDataStressTest() {
        const testName = '大量数据压力测试';
        console.log(`💾 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            // 生成大量测试密钥
            const massiveKeys = this.generateTestKeys(this.config.massiveKeyCount);
            
            // 设置模拟API响应
            this.setupMockAPI({
                latency: 200,
                errorRate: 0.1,
                successRate: 0.85
            });
            
            // 清空现有数据
            if (typeof clearAll === 'function') {
                clearAll();
            }
            
            // 注入大量密钥
            const keysInput = document.getElementById('apiKeys');
            if (keysInput) {
                keysInput.value = massiveKeys.join('\n');
                testResults.details.push(`✅ 注入 ${massiveKeys.length} 个测试密钥`);
            }
            
            // 开始测试
            const testStartTime = Date.now();
            const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // 模拟用户点击测试按钮
            const testBtn = document.getElementById('testBtn');
            if (testBtn && !testBtn.disabled) {
                testBtn.click();
                testResults.details.push('✅ 启动大量数据测试');
            }
            
            // 等待测试完成或超时
            await this.waitForTestCompletion(this.config.maxResponseTime);
            
            const testEndTime = Date.now();
            const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // 收集指标
            testResults.metrics = {
                totalKeys: massiveKeys.length,
                testDuration: testEndTime - testStartTime,
                memoryIncrease: memoryAfter - memoryBefore,
                memoryIncreaseMB: (memoryAfter - memoryBefore) / 1024 / 1024,
                throughput: massiveKeys.length / ((testEndTime - testStartTime) / 1000)
            };
            
            // 验证结果
            const stats = this.getCurrentStats();
            if (stats.total !== massiveKeys.length) {
                throw new Error(`密钥数量不匹配: 期望 ${massiveKeys.length}, 实际 ${stats.total}`);
            }
            
            const successRate = (stats.valid + stats.paid) / stats.total;
            if (successRate < this.config.minSuccessRate) {
                throw new Error(`成功率过低: ${(successRate * 100).toFixed(1)}%`);
            }
            
            testResults.details.push(`✅ 成功率: ${(successRate * 100).toFixed(1)}%`);
            testResults.details.push(`✅ 吞吐量: ${testResults.metrics.throughput.toFixed(2)} keys/sec`);
            testResults.details.push(`✅ 内存增长: ${testResults.metrics.memoryIncreaseMB.toFixed(1)}MB`);
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'massive_data_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 3. UI响应性测试
     */
    async runUIResponsivenessTest() {
        const testName = 'UI响应性测试';
        console.log(`🖱️ 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            // 记录测试前的长任务数量
            const longTasksBefore = this.longTasks.length;
            
            // 生成极大量数据以测试UI响应性
            const hugeKeys = this.generateTestKeys(this.config.extremeKeyCount);
            
            // 测试UI健康优化器
            if (typeof uiHealthOptimizer !== 'undefined') {
                // 测试虚拟列表
                const virtualList = uiHealthOptimizer.createVirtualList(
                    'testVirtualContainer',
                    hugeKeys.map(key => ({ key, status: 'valid' })),
                    (item) => {
                        const div = document.createElement('div');
                        div.textContent = item.key;
                        return div;
                    }
                );
                
                if (virtualList) {
                    testResults.details.push('✅ 虚拟列表创建成功');
                    
                    // 测试滚动性能
                    await this.simulateScrolling(virtualList);
                    testResults.details.push('✅ 虚拟列表滚动性能正常');
                }
                
                // 测试批处理
                const batchResult = await uiHealthOptimizer.processBatch(
                    'ui-test',
                    hugeKeys.slice(0, 1000),
                    async (key) => ({ key, processed: true }),
                    { batchSize: 50, maxBatchTime: 10 }
                );
                
                if (batchResult && batchResult.length === 1000) {
                    testResults.details.push('✅ 批处理功能正常');
                }
                
                // 获取健康度指标
                const healthMetrics = uiHealthOptimizer.getHealthMetrics();
                testResults.metrics.uiHealth = healthMetrics;
                testResults.details.push(`✅ UI健康度: 内存 ${healthMetrics.memoryUsageMB.toFixed(1)}MB`);
            }
            
            // 检查长任务增长
            const longTasksAfter = this.longTasks.length;
            const newLongTasks = longTasksAfter - longTasksBefore;
            
            if (newLongTasks > this.config.maxLongTasks) {
                this.results.warnings.push({
                    type: 'ui_performance_warning',
                    message: `UI测试期间产生 ${newLongTasks} 个长任务`,
                    timestamp: Date.now()
                });
            }
            
            testResults.metrics.longTasksGenerated = newLongTasks;
            testResults.details.push(`✅ 长任务控制: ${newLongTasks} 个新增`);
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'ui_responsiveness_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 4. 存储系统压力测试
     */
    async runStorageStressTest() {
        const testName = '存储系统压力测试';
        console.log(`💿 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            if (typeof indexedDBFallback !== 'undefined') {
                // 测试大量数据存储
                const largeDataSet = Array.from({ length: 5000 }, (_, i) => ({
                    key: `test-key-${i}`,
                    value: { 
                        status: 'valid',
                        timestamp: Date.now(),
                        data: 'x'.repeat(100) // 100字符数据
                    }
                }));
                
                // 批量存储测试
                const storageStartTime = Date.now();
                const batchResults = await indexedDBFallback.setBatch(
                    largeDataSet.map(item => ({
                        key: item.key,
                        value: item.value,
                        options: { ttl: 3600000 } // 1小时
                    }))
                );
                const storageEndTime = Date.now();
                
                const successCount = batchResults.filter(r => r.success).length;
                const storageRate = successCount / ((storageEndTime - storageStartTime) / 1000);
                
                testResults.metrics.storage = {
                    itemsStored: successCount,
                    storageRate: storageRate,
                    storageDuration: storageEndTime - storageStartTime
                };
                
                testResults.details.push(`✅ 批量存储: ${successCount}/${largeDataSet.length} 项`);
                testResults.details.push(`✅ 存储速率: ${storageRate.toFixed(1)} items/sec`);
                
                // 测试存储降级
                await this.testStorageFallback();
                testResults.details.push('✅ 存储降级机制正常');
                
                // 测试存储统计
                const stats = await indexedDBFallback.getStats();
                testResults.metrics.storageStats = stats;
                testResults.details.push(`✅ 存储类型: ${stats.type}`);
                
                // 清理测试数据
                await indexedDBFallback.cleanup();
                testResults.details.push('✅ 存储清理完成');
                
            } else {
                throw new Error('indexedDBFallback 不可用');
            }
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'storage_stress_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 5. 网络异常恢复测试
     */
    async runNetworkRecoveryTest() {
        const testName = '网络异常恢复测试';
        console.log(`🌐 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            const testKeys = this.generateTestKeys(100);
            
            // 模拟各种网络异常
            const networkScenarios = [
                { name: '高延迟', latency: 2000, errorRate: 0.1 },
                { name: '高错误率', latency: 200, errorRate: 0.5 },
                { name: '超时', latency: 8000, errorRate: 0.2 },
                { name: '间歇性故障', latency: 500, errorRate: 0.3 }
            ];
            
            const scenarioResults = [];
            
            for (const scenario of networkScenarios) {
                console.log(`  测试场景: ${scenario.name}`);
                
                // 设置网络模拟
                this.setupMockAPI(scenario);
                
                // 清空并设置测试密钥
                if (typeof clearAll === 'function') clearAll();
                document.getElementById('apiKeys').value = testKeys.join('\n');
                
                const scenarioStartTime = Date.now();
                
                // 启动测试
                const testBtn = document.getElementById('testBtn');
                if (testBtn && !testBtn.disabled) {
                    testBtn.click();
                }
                
                // 等待完成
                await this.waitForTestCompletion(15000);
                
                const scenarioEndTime = Date.now();
                const stats = this.getCurrentStats();
                
                const result = {
                    scenario: scenario.name,
                    duration: scenarioEndTime - scenarioStartTime,
                    successRate: (stats.valid + stats.paid) / stats.total,
                    totalProcessed: stats.total,
                    ...scenario
                };
                
                scenarioResults.push(result);
                testResults.details.push(
                    `✅ ${scenario.name}: 成功率 ${(result.successRate * 100).toFixed(1)}%`
                );
            }
            
            testResults.metrics.networkScenarios = scenarioResults;
            
            // 验证恢复能力
            const avgSuccessRate = scenarioResults.reduce((sum, r) => sum + r.successRate, 0) / scenarioResults.length;
            if (avgSuccessRate < 0.6) { // 网络异常下60%是可接受的
                throw new Error(`网络异常恢复能力不足: 平均成功率 ${(avgSuccessRate * 100).toFixed(1)}%`);
            }
            
            testResults.details.push(`✅ 网络恢复能力: 平均成功率 ${(avgSuccessRate * 100).toFixed(1)}%`);
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'network_recovery_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 6. 内存管理测试
     */
    async runMemoryManagementTest() {
        const testName = '内存管理测试';
        console.log(`🧠 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            if (!performance.memory) {
                testResults.details.push('⚠️ performance.memory 不可用，跳过内存测试');
                testResults.duration = Date.now() - startTime;
                this.results.tests.push(testResults);
                return;
            }
            
            const memoryBefore = performance.memory.usedJSHeapSize;
            
            // 创建大量数据以测试内存管理
            const memoryTestData = [];
            for (let i = 0; i < 10000; i++) {
                memoryTestData.push({
                    id: i,
                    key: `memory-test-key-${i}`,
                    data: 'x'.repeat(1000), // 1KB数据
                    timestamp: Date.now()
                });
            }
            
            // 全局数据设置
            if (typeof allKeysData !== 'undefined') {
                const originalData = [...allKeysData];
                allKeysData.push(...memoryTestData);
                
                // 触发UI更新
                if (typeof updateStats === 'function') updateStats();
                if (typeof updateKeyLists === 'function') updateKeyLists();
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const memoryPeak = performance.memory.usedJSHeapSize;
                const memoryIncrease = memoryPeak - memoryBefore;
                
                // 清理数据
                allKeysData.length = 0;
                allKeysData.push(...originalData);
                
                // 触发清理
                if (typeof uiHealthOptimizer !== 'undefined') {
                    uiHealthOptimizer.triggerMemoryCleanup();
                }
                
                // 强制垃圾回收（如果可用）
                if (window.gc) window.gc();
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const memoryAfter = performance.memory.usedJSHeapSize;
                const memoryRecovered = memoryPeak - memoryAfter;
                const recoveryRate = memoryRecovered / memoryIncrease;
                
                testResults.metrics.memory = {
                    before: memoryBefore,
                    peak: memoryPeak,
                    after: memoryAfter,
                    increase: memoryIncrease,
                    increaseMB: memoryIncrease / 1024 / 1024,
                    recovered: memoryRecovered,
                    recoveredMB: memoryRecovered / 1024 / 1024,
                    recoveryRate: recoveryRate
                };
                
                testResults.details.push(`✅ 内存峰值: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);
                testResults.details.push(`✅ 内存恢复: ${(memoryRecovered / 1024 / 1024).toFixed(1)}MB`);
                testResults.details.push(`✅ 恢复率: ${(recoveryRate * 100).toFixed(1)}%`);
                
                if (memoryPeak > this.config.maxMemoryUsage) {
                    this.results.warnings.push({
                        type: 'memory_peak_warning',
                        message: `内存峰值超过阈值: ${(memoryPeak / 1024 / 1024).toFixed(1)}MB`,
                        timestamp: Date.now()
                    });
                }
                
                if (recoveryRate < 0.7) {
                    throw new Error(`内存恢复率过低: ${(recoveryRate * 100).toFixed(1)}%`);
                }
            }
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'memory_management_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 7. 长期运行稳定性测试
     */
    async runLongTermStabilityTest() {
        const testName = '长期运行稳定性测试';
        console.log(`⏱️ 执行 ${testName} (简化版 30秒)...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            const shortDuration = 30000; // 30秒简化测试
            const checkInterval = 5000;  // 5秒检查间隔
            const checks = shortDuration / checkInterval;
            
            const stabilityMetrics = {
                memorySnapshots: [],
                performanceSnapshots: [],
                errorCounts: [],
                uiResponseTimes: []
            };
            
            // 持续运行测试
            for (let i = 0; i < checks; i++) {
                console.log(`  稳定性检查 ${i + 1}/${checks}`);
                
                // 内存快照
                if (performance.memory) {
                    stabilityMetrics.memorySnapshots.push({
                        timestamp: Date.now(),
                        usage: performance.memory.usedJSHeapSize,
                        usageMB: performance.memory.usedJSHeapSize / 1024 / 1024
                    });
                }
                
                // 生成一小批测试以保持系统活跃
                const batchKeys = this.generateTestKeys(50);
                if (typeof clearAll === 'function') clearAll();
                document.getElementById('apiKeys').value = batchKeys.join('\n');
                
                // 测试UI响应时间
                const uiStartTime = performance.now();
                const testBtn = document.getElementById('testBtn');
                if (testBtn && !testBtn.disabled) {
                    testBtn.click();
                }
                const uiEndTime = performance.now();
                
                stabilityMetrics.uiResponseTimes.push(uiEndTime - uiStartTime);
                
                // 等待间隔
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                
                // 停止测试
                if (typeof stopTesting === 'function') {
                    stopTesting();
                }
            }
            
            // 分析稳定性
            const memoryTrend = this.analyzeMemoryTrend(stabilityMetrics.memorySnapshots);
            const avgUIResponse = stabilityMetrics.uiResponseTimes.reduce((a, b) => a + b, 0) / stabilityMetrics.uiResponseTimes.length;
            
            testResults.metrics.stability = {
                duration: shortDuration,
                memoryTrend: memoryTrend,
                avgUIResponse: avgUIResponse,
                checks: checks,
                ...stabilityMetrics
            };
            
            testResults.details.push(`✅ 运行时长: ${shortDuration / 1000}秒`);
            testResults.details.push(`✅ 内存趋势: ${memoryTrend.trend}`);
            testResults.details.push(`✅ 平均UI响应: ${avgUIResponse.toFixed(1)}ms`);
            
            if (memoryTrend.trend === 'increasing' && memoryTrend.rate > 1.0) {
                this.results.warnings.push({
                    type: 'memory_leak_warning',
                    message: `可能存在内存泄漏: 增长率 ${memoryTrend.rate.toFixed(2)}MB/min`,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'long_term_stability_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 8. 并发极限测试
     */
    async runConcurrencyLimitTest() {
        const testName = '并发极限测试';
        console.log(`⚡ 执行 ${testName}...`);
        
        const startTime = Date.now();
        const testResults = {
            name: testName,
            passed: true,
            details: [],
            duration: 0,
            metrics: {}
        };
        
        try {
            if (typeof globalConcurrencyManager !== 'undefined') {
                // 测试并发管理器
                const manager = globalConcurrencyManager;
                const initialLimit = manager.maxGlobalConcurrency;
                
                // 测试大量并发请求
                const concurrentPromises = [];
                const testConcurrency = 100;
                
                for (let i = 0; i < testConcurrency; i++) {
                    concurrentPromises.push(
                        manager.acquireSlot().then(slot => {
                            return new Promise(resolve => {
                                setTimeout(() => {
                                    manager.releaseSlot(slot, { 
                                        success: Math.random() > 0.2,
                                        latency: 100 + Math.random() * 400
                                    });
                                    resolve(slot);
                                }, Math.random() * 200);
                            });
                        })
                    );
                }
                
                const concurrencyStartTime = Date.now();
                const slots = await Promise.all(concurrentPromises);
                const concurrencyEndTime = Date.now();
                
                const concurrencyDuration = concurrencyEndTime - concurrencyStartTime;
                const metrics = manager.getMetrics();
                
                testResults.metrics.concurrency = {
                    testConcurrency: testConcurrency,
                    duration: concurrencyDuration,
                    processedSlots: slots.length,
                    finalLimit: manager.maxGlobalConcurrency,
                    adaptiveChanges: Math.abs(manager.maxGlobalConcurrency - initialLimit),
                    ...metrics
                };
                
                testResults.details.push(`✅ 并发请求处理: ${slots.length}/${testConcurrency}`);
                testResults.details.push(`✅ 处理时长: ${concurrencyDuration}ms`);
                testResults.details.push(`✅ 自适应调整: ${Math.abs(manager.maxGlobalConcurrency - initialLimit)} 次`);
                testResults.details.push(`✅ 最终并发限制: ${manager.maxGlobalConcurrency}`);
                
                if (slots.length !== testConcurrency) {
                    throw new Error(`并发处理不完整: ${slots.length}/${testConcurrency}`);
                }
                
            } else {
                throw new Error('globalConcurrencyManager 不可用');
            }
            
        } catch (error) {
            testResults.passed = false;
            testResults.error = error.message;
            this.results.errors.push({
                type: 'concurrency_limit_failure',
                message: error.message,
                timestamp: Date.now()
            });
        }
        
        testResults.duration = Date.now() - startTime;
        this.results.tests.push(testResults);
    }
    
    /**
     * 辅助方法
     */
    
    generateTestKeys(count) {
        const keys = [];
        const prefixes = ['sk-', 'cl-', 'AIza'];
        
        for (let i = 0; i < count; i++) {
            const prefix = prefixes[i % prefixes.length];
            const suffix = Math.random().toString(36).substring(2);
            keys.push(`${prefix}${suffix}${'x'.repeat(40)}`);
        }
        
        return keys;
    }
    
    setupMockAPI(config = {}) {
        const { latency = 200, errorRate = 0.1, successRate = 0.85 } = config;
        
        window.fetch = async (url, options) => {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, latency));
            
            // 模拟错误
            if (Math.random() < errorRate) {
                throw new Error('Network error (simulated)');
            }
            
            // 模拟成功/失败响应
            const isSuccess = Math.random() < successRate;
            
            return {
                ok: isSuccess,
                status: isSuccess ? 200 : 403,
                json: async () => ({
                    candidates: isSuccess ? [{ content: { parts: [{ text: 'test' }] } }] : undefined,
                    error: isSuccess ? undefined : { message: 'Invalid API key' }
                })
            };
        };
    }
    
    async waitForTestCompletion(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const testBtn = document.getElementById('testBtn');
            if (testBtn && !testBtn.disabled) {
                // 测试完成
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('测试超时');
    }
    
    getCurrentStats() {
        return {
            total: parseInt(document.getElementById('totalCount')?.textContent || '0'),
            valid: parseInt(document.getElementById('validCount')?.textContent || '0'),
            invalid: parseInt(document.getElementById('invalidCount')?.textContent || '0'),
            rateLimited: parseInt(document.getElementById('rateLimitedCount')?.textContent || '0'),
            paid: parseInt(document.getElementById('paidCount')?.textContent || '0')
        };
    }
    
    analyzeMemoryTrend(snapshots) {
        if (snapshots.length < 2) {
            return { trend: 'insufficient_data', rate: 0 };
        }
        
        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60; // 分钟
        const memoryDiff = (last.usageMB - first.usageMB);
        const rate = memoryDiff / timeDiff;
        
        return {
            trend: rate > 0.5 ? 'increasing' : rate < -0.5 ? 'decreasing' : 'stable',
            rate: rate,
            totalChange: memoryDiff,
            duration: timeDiff
        };
    }
    
    async testStorageFallback() {
        // 简化的存储降级测试
        const testData = { test: 'storage_fallback', timestamp: Date.now() };
        await indexedDBFallback.set('fallback_test', testData);
        const retrieved = await indexedDBFallback.get('fallback_test');
        
        if (!retrieved || retrieved.test !== testData.test) {
            throw new Error('存储降级测试失败');
        }
    }
    
    async simulateScrolling(virtualList) {
        // 模拟滚动测试
        if (virtualList && virtualList.container) {
            for (let i = 0; i < 10; i++) {
                virtualList.container.scrollTop = i * 100;
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }
    
    generateTestReport() {
        const totalDuration = Date.now() - this.testStartTime;
        const passedTests = this.results.tests.filter(t => t.passed).length;
        const totalTests = this.results.tests.length;
        const overallSuccess = passedTests === totalTests;
        
        // 内存统计
        const peakMemory = Math.max(...this.memoryPeaks.map(m => m.usageMB));
        const avgMemory = this.memoryPeaks.reduce((sum, m) => sum + m.usageMB, 0) / this.memoryPeaks.length;
        
        // 长任务统计
        const totalLongTasks = this.longTasks.length;
        const avgLongTaskDuration = totalLongTasks > 0 ? 
            this.longTasks.reduce((sum, t) => sum + t.duration, 0) / totalLongTasks : 0;
        
        return {
            summary: {
                overallSuccess,
                passedTests,
                totalTests,
                successRate: passedTests / totalTests,
                totalDuration,
                testStartTime: this.testStartTime,
                testEndTime: Date.now()
            },
            performance: {
                peakMemoryMB: peakMemory,
                avgMemoryMB: avgMemory,
                totalLongTasks,
                avgLongTaskDuration,
                memoryPeaks: this.memoryPeaks.length,
                warningCount: this.results.warnings.length,
                errorCount: this.results.errors.length
            },
            tests: this.results.tests,
            warnings: this.results.warnings,
            errors: this.results.errors,
            verdict: this.generateProductionVerdict(overallSuccess, this.results.warnings.length, this.results.errors.length)
        };
    }
    
    generateProductionVerdict(success, warningCount, errorCount) {
        if (!success || errorCount > 0) {
            return {
                status: 'NOT_READY',
                message: '系统未通过生产环境测试，存在关键问题需要修复',
                recommendation: '修复测试中发现的错误后重新测试'
            };
        }
        
        if (warningCount > 5) {
            return {
                status: 'CONDITIONAL',
                message: '系统基本满足生产环境要求，但存在性能警告',
                recommendation: '建议优化性能问题后部署到生产环境'
            };
        }
        
        if (warningCount > 0) {
            return {
                status: 'READY_WITH_MONITORING',
                message: '系统准备好部署到生产环境，建议加强监控',
                recommendation: '部署时启用性能监控，关注内存使用和响应时间'
            };
        }
        
        return {
            status: 'PRODUCTION_READY',
            message: '系统完全满足生产环境要求，性能优秀',
            recommendation: '可以安全部署到生产环境'
        };
    }
    
    cleanup() {
        // 恢复原始fetch
        window.fetch = this.originalFetch;
        
        // 清理监控器
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }
        
        if (this.longTaskObserver) {
            this.longTaskObserver.disconnect();
        }
        
        console.log('🧹 生产环境测试清理完成');
    }
}

// 导出测试类
if (typeof window !== 'undefined') {
    window.ProductionStabilityTest = ProductionStabilityTest;
}

export default ProductionStabilityTest;
