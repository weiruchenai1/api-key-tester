import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements
document.body.innerHTML = `
    <div id="resultsContainer"></div>
    <div id="progressBar"></div>
    <div id="progressFill"></div>
`;

// Mock performance API with realistic values
global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 * 10, // 10MB
        totalJSHeapSize: 1024 * 1024 * 50, // 50MB
        jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
    },
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => [])
};

// Mock console methods
global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn()
};

// Mock fetch API
global.fetch = vi.fn();

// Mock localStorage
global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

describe('Performance and Stress Tests', () => {
    let highSpeedController;
    let adaptiveConcurrencyManager;
    let enhancedMemoryManager;
    let highPerformanceProcessor;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Import modules
        await import('../../js/core/adaptiveConcurrencyManager.js');
        await import('../../js/core/smartRetryManager.js');
        await import('../../js/core/enhancedMemoryManager.js');
        await import('../../js/core/highPerformanceProcessor.js');
        await import('../../js/core/networkOptimizer.js');
        await import('../../js/core/highSpeedController.js');

        // Get instances
        highSpeedController = global.highSpeedController;
        adaptiveConcurrencyManager = global.adaptiveConcurrencyManager;
        enhancedMemoryManager = global.enhancedMemoryManager;
        highPerformanceProcessor = global.highPerformanceProcessor;

        // Initialize
        if (highSpeedController) {
            highSpeedController.cleanup();
            await highSpeedController.initialize();
        }
    });

    afterEach(() => {
        if (highSpeedController) {
            highSpeedController.cleanup();
        }
    });

    describe('Large Scale Performance Tests', () => {
        test('should handle 1000 keys efficiently', async () => {
            const keys = Array.from({length: 1000}, (_, i) => `sk-perf-${i.toString().padStart(4, '0')}`);
            
            // Mock fast API responses
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [{ id: 'gpt-4', object: 'model' }] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                return { key, status: 'valid', model: 'gpt-4' };
            });

            const startTime = performance.now();
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, 'openai');
            const endTime = performance.now();

            const processingTime = endTime - startTime;
            const keysPerSecond = keys.length / (processingTime / 1000);

            expect(results.length).toBe(1000);
            expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
            expect(keysPerSecond).toBeGreaterThan(50); // Should process at least 50 keys/second

            console.log(`Performance: ${keysPerSecond.toFixed(2)} keys/second`);
        });

        test('should handle 10000 keys with memory optimization', async () => {
            const keys = Array.from({length: 10000}, (_, i) => `sk-stress-${i.toString().padStart(5, '0')}`);
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { key, status: 'valid' };
            });

            const initialMemory = performance.memory.usedJSHeapSize;
            
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, 'openai');
            
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;

            expect(results.length).toBe(10000);
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should not increase by more than 50MB

            // Check that memory cleanup occurred
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            expect(memoryStats.performance.cleanupCount).toBeGreaterThan(0);
        });

        test('should maintain performance under concurrent load', async () => {
            const batchSize = 100;
            const concurrentBatches = 10;
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
                return { key, status: 'valid' };
            });

            const promises = [];
            const startTime = performance.now();

            for (let i = 0; i < concurrentBatches; i++) {
                const keys = Array.from({length: batchSize}, (_, j) => `sk-concurrent-${i}-${j}`);
                promises.push(highSpeedController.detectKeysAtHighSpeed(keys, 'openai'));
            }

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const totalKeys = batchSize * concurrentBatches;
            const processingTime = endTime - startTime;
            const throughput = totalKeys / (processingTime / 1000);

            expect(results.length).toBe(concurrentBatches);
            expect(results.every(batch => batch.length === batchSize)).toBe(true);
            expect(throughput).toBeGreaterThan(30); // Should maintain reasonable throughput

            console.log(`Concurrent throughput: ${throughput.toFixed(2)} keys/second`);
        });
    });

    describe('Memory Stress Tests', () => {
        test('should handle memory pressure gracefully', async () => {
            // Simulate high memory usage
            global.performance.memory.usedJSHeapSize = 80 * 1024 * 1024; // 80MB

            // Add large amount of data
            for (let i = 0; i < 5000; i++) {
                enhancedMemoryManager.addKey({
                    key: `sk-memory-${i}`,
                    status: 'pending',
                    data: new Array(200).fill(`large-data-${i}`),
                    startTime: Date.now()
                });
            }

            const beforeCleanup = enhancedMemoryManager.getDetailedStats();
            
            // Trigger memory cleanup
            enhancedMemoryManager.performCleanup();
            
            const afterCleanup = enhancedMemoryManager.getDetailedStats();

            expect(afterCleanup.memory.totalKeys).toBeLessThanOrEqual(beforeCleanup.memory.totalKeys);
            expect(afterCleanup.performance.cleanupCount).toBeGreaterThan(0);
        });

        test('should prevent memory leaks in long-running operations', async () => {
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Simulate long-running operation with many cycles
            for (let cycle = 0; cycle < 10; cycle++) {
                const keys = Array.from({length: 100}, (_, i) => `sk-cycle-${cycle}-${i}`);
                
                // Add keys
                keys.forEach(key => {
                    enhancedMemoryManager.addKey({
                        key,
                        status: 'pending',
                        data: new Array(50).fill('test-data'),
                        startTime: Date.now()
                    });
                });

                // Process and update
                keys.forEach(key => {
                    enhancedMemoryManager.updateKeyStatus(key, 'valid', {
                        model: 'gpt-4',
                        responseTime: 100
                    });
                });

                // Simulate cleanup between cycles
                if (cycle % 3 === 0) {
                    enhancedMemoryManager.performCleanup();
                }

                // Small delay to simulate real processing
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory should not have grown excessively
            expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase
        });

        test('should handle rapid allocation and deallocation', async () => {
            const cycles = 50;
            const keysPerCycle = 100;

            for (let i = 0; i < cycles; i++) {
                // Allocate
                const keys = Array.from({length: keysPerCycle}, (_, j) => `sk-rapid-${i}-${j}`);
                keys.forEach(key => {
                    enhancedMemoryManager.addKey({
                        key,
                        status: 'pending',
                        data: new Array(100).fill('data'),
                        startTime: Date.now()
                    });
                });

                // Deallocate
                keys.forEach(key => {
                    enhancedMemoryManager.removeKey(key);
                });

                // Periodic cleanup
                if (i % 10 === 0) {
                    enhancedMemoryManager.performCleanup();
                }
            }

            const stats = enhancedMemoryManager.getDetailedStats();
            expect(stats.memory.totalKeys).toBe(0); // Should have cleaned up everything
        });
    });

    describe('Concurrency Stress Tests', () => {
        test('should handle maximum concurrency without deadlocks', async () => {
            const maxConcurrency = 50;
            adaptiveConcurrencyManager.config.maxConcurrency = maxConcurrency;

            const promises = [];
            const startTime = performance.now();

            // Create more requests than max concurrency
            for (let i = 0; i < maxConcurrency * 2; i++) {
                promises.push((async () => {
                    const slot = await adaptiveConcurrencyManager.acquireSlot();
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                    return i;
                })());
            }

            const results = await Promise.all(promises);
            const endTime = performance.now();

            expect(results.length).toBe(maxConcurrency * 2);
            expect(endTime - startTime).toBeLessThan(10000); // Should not hang indefinitely

            const stats = adaptiveConcurrencyManager.getDetailedStats();
            expect(stats.concurrency.current).toBe(0); // All slots should be released
        });

        test('should adapt concurrency under varying load', async () => {
            const phases = [
                { requests: 10, delay: 50, expectedConcurrency: 'low' },
                { requests: 50, delay: 20, expectedConcurrency: 'medium' },
                { requests: 100, delay: 10, expectedConcurrency: 'high' }
            ];

            for (const phase of phases) {
                const promises = [];
                
                for (let i = 0; i < phase.requests; i++) {
                    promises.push((async () => {
                        const slot = await adaptiveConcurrencyManager.acquireSlot();
                        await new Promise(resolve => setTimeout(resolve, phase.delay));
                        adaptiveConcurrencyManager.releaseSlot(slot, { 
                            success: true, 
                            responseTime: phase.delay 
                        });
                    })());
                }

                await Promise.all(promises);
                
                // Trigger adaptation
                adaptiveConcurrencyManager.adaptConcurrency();
                
                const stats = adaptiveConcurrencyManager.getDetailedStats();
                console.log(`Phase ${phase.expectedConcurrency}: Concurrency = ${stats.concurrency.max}`);
            }

            const finalStats = adaptiveConcurrencyManager.getDetailedStats();
            expect(finalStats.concurrency.max).toBeGreaterThan(5); // Should have scaled up
        });

        test('should handle concurrency bursts', async () => {
            // Create sudden burst of requests
            const burstSize = 200;
            const burstPromises = [];

            const startTime = performance.now();

            for (let i = 0; i < burstSize; i++) {
                burstPromises.push((async () => {
                    const slot = await adaptiveConcurrencyManager.acquireSlot();
                    await new Promise(resolve => setTimeout(resolve, 50));
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                    return i;
                })());
            }

            const results = await Promise.all(burstPromises);
            const endTime = performance.now();

            expect(results.length).toBe(burstSize);
            expect(endTime - startTime).toBeLessThan(15000); // Should handle burst efficiently

            const stats = adaptiveConcurrencyManager.getDetailedStats();
            expect(stats.performance.totalRequests).toBe(burstSize);
        });
    });

    describe('Network Stress Tests', () => {
        test('should handle network failures gracefully', async () => {
            const networkOptimizer = global.networkOptimizer;
            let failureCount = 0;
            const totalRequests = 100;

            // Mock intermittent failures
            global.fetch.mockImplementation(() => {
                failureCount++;
                if (failureCount % 3 === 0) {
                    return Promise.reject(new Error('Network timeout'));
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                });
            });

            const promises = [];
            for (let i = 0; i < totalRequests; i++) {
                promises.push(
                    networkOptimizer.optimizedFetch(`https://api.test.com/v1/test-${i}`, {
                        method: 'GET'
                    }).catch(error => ({ error: error.message }))
                );
            }

            const results = await Promise.all(promises);
            
            const successCount = results.filter(r => !r.error).length;
            const errorCount = results.filter(r => r.error).length;

            expect(successCount + errorCount).toBe(totalRequests);
            expect(successCount).toBeGreaterThan(totalRequests * 0.6); // At least 60% success

            const stats = networkOptimizer.getDetailedStats();
            expect(stats.performance.networkErrors).toBe(errorCount);
        });

        test('should optimize connection reuse under load', async () => {
            const networkOptimizer = global.networkOptimizer;
            const host = 'api.test.com';
            const requestCount = 50;

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            // Make many requests to same host
            const promises = [];
            for (let i = 0; i < requestCount; i++) {
                promises.push(
                    networkOptimizer.optimizedFetch(`https://${host}/v1/test-${i}`, {
                        method: 'GET'
                    })
                );
            }

            await Promise.all(promises);

            const stats = networkOptimizer.getDetailedStats();
            expect(stats.connections.poolHits).toBeGreaterThan(0);
            expect(stats.connections.poolHits / requestCount).toBeGreaterThan(0.5); // Good reuse ratio
        });
    });

    describe('UI Performance Tests', () => {
        test('should maintain UI responsiveness during heavy processing', async () => {
            const items = Array.from({length: 1000}, (_, i) => ({ id: i, data: `item-${i}` }));
            let frameDrops = 0;

            // Mock frame rate monitoring
            highPerformanceProcessor.checkFrameRate = vi.fn().mockImplementation(() => {
                if (Math.random() < 0.1) { // 10% chance of frame drop
                    frameDrops++;
                    highPerformanceProcessor.frameDropDetection.droppedFrames++;
                }
            });

            const processFunction = async (item) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return { processed: true, item };
            };

            const result = await highPerformanceProcessor.processBatch(items, processFunction, {
                batchSize: 50
            });

            expect(result.totalProcessed).toBe(1000);
            
            const metrics = highPerformanceProcessor.getMetrics();
            expect(metrics.droppedFrames).toBeLessThan(50); // Should maintain good frame rate
        });

        test('should batch UI updates efficiently', async () => {
            const updateCount = 1000;
            const results = Array.from({length: updateCount}, (_, i) => ({
                success: true,
                result: { key: `sk-ui-${i}`, status: 'valid' }
            }));

            const startTime = performance.now();
            
            // Cache results in batches
            for (let i = 0; i < updateCount; i += 100) {
                highPerformanceProcessor.cacheResults(results.slice(i, i + 100));
            }

            // Flush to UI
            highPerformanceProcessor.flushResultsToUI();
            
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should be fast

            const metrics = highPerformanceProcessor.getMetrics();
            expect(metrics.uiUpdateCount).toBeGreaterThan(0);
            expect(metrics.avgUiUpdateTime).toBeLessThan(100); // Should be efficient
        });
    });

    describe('Integration Stress Tests', () => {
        test('should handle complete system under maximum load', async () => {
            const keys = Array.from({length: 500}, (_, i) => `sk-system-${i}`);
            
            global.fetch.mockImplementation(() => {
                // Simulate varying response times and occasional failures
                const delay = Math.random() * 100;
                const shouldFail = Math.random() < 0.05; // 5% failure rate
                
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (shouldFail) {
                            reject(new Error('Random failure'));
                        } else {
                            resolve({
                                ok: true,
                                json: () => Promise.resolve({ data: [] })
                            });
                        }
                    }, delay);
                });
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                const slot = await adaptiveConcurrencyManager.acquireSlot();
                
                try {
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
                    
                    enhancedMemoryManager.updateKeyStatus(key, 'valid', {
                        model: 'gpt-4',
                        responseTime: Math.random() * 200
                    });
                    
                    return { key, status: 'valid', model: 'gpt-4' };
                } catch (error) {
                    enhancedMemoryManager.updateKeyStatus(key, 'error', {
                        error: error.message
                    });
                    return { key, status: 'error', error: error.message };
                } finally {
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                }
            });

            const startTime = performance.now();
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, 'openai');
            const endTime = performance.now();

            expect(results.length).toBe(500);
            expect(endTime - startTime).toBeLessThan(20000); // Should complete in reasonable time

            // Verify system stability
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            const memoryStats = enhancedMemoryManager.getDetailedStats();

            expect(concurrencyStats.concurrency.current).toBe(0); // All slots released
            expect(memoryStats.memory.totalKeys).toBe(500); // All keys tracked
            expect(memoryStats.performance.cleanupCount).toBeGreaterThan(0); // Cleanup occurred
        });

        test('should recover from system overload', async () => {
            // Simulate system overload
            global.performance.memory.usedJSHeapSize = 95 * 1024 * 1024; // 95MB of 100MB limit

            const keys = Array.from({length: 100}, (_, i) => `sk-overload-${i}`);

            // Add memory pressure
            for (let i = 0; i < 1000; i++) {
                enhancedMemoryManager.addKey({
                    key: `sk-pressure-${i}`,
                    status: 'pending',
                    data: new Array(500).fill('pressure-data'),
                    startTime: Date.now()
                });
            }

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return { key, status: 'valid' };
            });

            // System should handle overload gracefully
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, 'openai');

            expect(results.length).toBe(100);

            // Check that system recovered
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            expect(memoryStats.performance.cleanupCount).toBeGreaterThan(0);

            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            expect(concurrencyStats.concurrency.max).toBeLessThan(20); // Should have throttled
        });
    });
});
