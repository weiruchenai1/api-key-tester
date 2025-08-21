import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements
document.body.innerHTML = `
    <div id="resultsContainer"></div>
    <div id="progressBar"></div>
    <div id="progressFill"></div>
`;

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock fetch API
global.fetch = vi.fn();

// Mock performance API
global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 * 10, // 10MB
        totalJSHeapSize: 1024 * 1024 * 50  // 50MB
    }
};

// Mock console methods
global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

describe('Optimization Modules Integration', () => {
    let adaptiveConcurrencyManager;
    let smartRetryManager;
    let enhancedMemoryManager;
    let highPerformanceProcessor;
    let networkOptimizer;
    let highSpeedController;

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks();
        
        // Import all modules
        await import('../../js/core/adaptiveConcurrencyManager.js');
        await import('../../js/core/smartRetryManager.js');
        await import('../../js/core/enhancedMemoryManager.js');
        await import('../../js/core/highPerformanceProcessor.js');
        await import('../../js/core/networkOptimizer.js');
        await import('../../js/core/highSpeedController.js');

        // Get module instances
        adaptiveConcurrencyManager = global.adaptiveConcurrencyManager;
        smartRetryManager = global.smartRetryManager;
        enhancedMemoryManager = global.enhancedMemoryManager;
        highPerformanceProcessor = global.highPerformanceProcessor;
        networkOptimizer = global.networkOptimizer;
        highSpeedController = global.highSpeedController;

        // Initialize all modules
        if (adaptiveConcurrencyManager) {
            adaptiveConcurrencyManager.cleanup();
            await adaptiveConcurrencyManager.initialize();
        }
        if (smartRetryManager) {
            smartRetryManager.cleanup();
            await smartRetryManager.initialize();
        }
        if (enhancedMemoryManager) {
            enhancedMemoryManager.cleanup();
            await enhancedMemoryManager.initialize();
        }
        if (highPerformanceProcessor) {
            highPerformanceProcessor.cleanup();
            await highPerformanceProcessor.initialize();
        }
        if (networkOptimizer) {
            networkOptimizer.cleanup();
            await networkOptimizer.initialize();
        }
        if (highSpeedController) {
            highSpeedController.cleanup();
            await highSpeedController.initialize();
        }
    });

    afterEach(() => {
        // Cleanup all modules
        [adaptiveConcurrencyManager, smartRetryManager, enhancedMemoryManager, 
         highPerformanceProcessor, networkOptimizer, highSpeedController].forEach(module => {
            if (module && typeof module.cleanup === 'function') {
                module.cleanup();
            }
        });
    });

    describe('Module Initialization Integration', () => {
        test('should initialize all modules without conflicts', async () => {
            expect(adaptiveConcurrencyManager).toBeDefined();
            expect(smartRetryManager).toBeDefined();
            expect(enhancedMemoryManager).toBeDefined();
            expect(highPerformanceProcessor).toBeDefined();
            expect(networkOptimizer).toBeDefined();
            expect(highSpeedController).toBeDefined();
        });

        test('should have high speed controller integrate all modules', async () => {
            const stats = highSpeedController.getDetailedStats();
            
            expect(stats.modules).toBeDefined();
            expect(Object.keys(stats.modules).length).toBeGreaterThan(0);
        });
    });

    describe('Concurrency and Memory Integration', () => {
        test('should coordinate concurrency with memory management', async () => {
            // Add keys to memory manager
            for (let i = 0; i < 50; i++) {
                enhancedMemoryManager.addKey({
                    key: `sk-integration-${i}`,
                    status: 'pending',
                    startTime: Date.now()
                });
            }

            // Acquire multiple slots
            const slots = [];
            for (let i = 0; i < 5; i++) {
                const slot = await adaptiveConcurrencyManager.acquireSlot();
                slots.push(slot);
            }

            // Check that memory manager tracks the activity
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();

            expect(memoryStats.memory.totalKeys).toBe(50);
            expect(concurrencyStats.concurrency.current).toBe(5);

            // Release slots
            slots.forEach(slot => {
                adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
            });
        });

        test('should handle memory pressure affecting concurrency', async () => {
            // Simulate high memory usage
            global.performance.memory.usedJSHeapSize = 45 * 1024 * 1024; // 45MB of 50MB

            // Add many keys to trigger memory pressure
            for (let i = 0; i < 1000; i++) {
                enhancedMemoryManager.addKey({
                    key: `sk-memory-pressure-${i}`,
                    status: 'pending',
                    data: new Array(100).fill('test-data'),
                    startTime: Date.now()
                });
            }

            // Trigger memory cleanup
            enhancedMemoryManager.performCleanup();

            // Concurrency should adapt to memory constraints
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            expect(concurrencyStats.concurrency.max).toBeLessThanOrEqual(10);
        });
    });

    describe('Retry and Network Integration', () => {
        test('should coordinate retry logic with network optimization', async () => {
            // Mock network responses
            global.fetch
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });

            const testFunction = async () => {
                return await networkOptimizer.optimizedFetch('https://api.test.com/v1/test', {
                    method: 'POST',
                    body: JSON.stringify({ test: true })
                });
            };

            // Execute with retry
            const result = await smartRetryManager.executeWithRetry('test-key', testFunction, {
                apiType: 'openai'
            });

            expect(result.success).toBe(true);

            // Check that both modules tracked the operations
            const retryStats = smartRetryManager.getStats();
            const networkStats = networkOptimizer.getDetailedStats();

            expect(retryStats.totalRetries).toBe(1);
            expect(networkStats.requests.total).toBeGreaterThan(0);
        });

        test('should handle network optimization affecting retry decisions', async () => {
            // Simulate rate limiting
            networkOptimizer.recordRateLimit('api.test.com');

            const testFunction = async () => {
                if (networkOptimizer.isHostRateLimited('api.test.com')) {
                    const error = new Error('Rate limited');
                    error.status = 429;
                    throw error;
                }
                return { success: true };
            };

            try {
                await smartRetryManager.executeWithRetry('test-key', testFunction, {
                    apiType: 'openai'
                });
            } catch (error) {
                expect(error.status).toBe(429);
            }

            const retryStats = smartRetryManager.getStats();
            expect(retryStats.fastFails).toBeGreaterThan(0);
        });
    });

    describe('Processing and UI Integration', () => {
        test('should coordinate batch processing with UI updates', async () => {
            const items = Array.from({length: 100}, (_, i) => ({
                key: `sk-batch-${i}`,
                status: 'pending'
            }));

            const processFunction = async (item, index) => {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 10));
                
                // Update memory manager
                enhancedMemoryManager.updateKeyStatus(item.key, 'valid', {
                    model: 'gpt-4',
                    responseTime: 150
                });

                return { processed: true, item, index };
            };

            const result = await highPerformanceProcessor.processBatch(items, processFunction, {
                batchSize: 20
            });

            expect(result.totalProcessed).toBe(100);
            expect(result.successful).toBe(100);

            // Check UI updates were cached
            const processorMetrics = highPerformanceProcessor.getMetrics();
            expect(processorMetrics.uiUpdateCount).toBeGreaterThan(0);

            // Check memory manager was updated
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            expect(memoryStats.memory.totalKeys).toBe(100);
        });

        test('should handle UI performance affecting processing strategy', async () => {
            // Simulate slow UI updates
            highPerformanceProcessor.frameDropDetection.droppedFrames = 10;

            const items = Array.from({length: 50}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockResolvedValue({ processed: true });

            await highPerformanceProcessor.processBatch(items, processFunction);

            // Should have adapted batch size for better UI performance
            const metrics = highPerformanceProcessor.getMetrics();
            expect(metrics.adaptiveOptimizations).toBeGreaterThan(0);
        });
    });

    describe('End-to-End Integration Scenarios', () => {
        test('should handle complete key detection workflow', async () => {
            const keys = ['sk-test1', 'sk-test2', 'sk-test3'];
            const apiType = 'openai';

            // Mock successful API responses
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    data: [{ id: 'gpt-4', object: 'model' }]
                })
            });

            // Mock high speed controller's detection method
            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                // Simulate the full workflow
                
                // 1. Acquire concurrency slot
                const slot = await adaptiveConcurrencyManager.acquireSlot();
                
                try {
                    // 2. Execute with retry and network optimization
                    const result = await smartRetryManager.executeWithRetry(key, async () => {
                        return await networkOptimizer.optimizedFetch('https://api.openai.com/v1/models', {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${key}` }
                        });
                    }, { apiType });

                    // 3. Update memory manager
                    enhancedMemoryManager.updateKeyStatus(key, 'valid', {
                        model: 'gpt-4',
                        responseTime: 200
                    });

                    return { key, status: 'valid', model: 'gpt-4' };
                } finally {
                    // 4. Release concurrency slot
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                }
            });

            // Execute the workflow
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, apiType);

            expect(results.length).toBe(3);
            expect(results.every(r => r.status === 'valid')).toBe(true);

            // Verify all modules were involved
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            const retryStats = smartRetryManager.getStats();
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            const networkStats = networkOptimizer.getDetailedStats();

            expect(concurrencyStats.performance.totalRequests).toBe(3);
            expect(retryStats.totalRetries).toBeGreaterThanOrEqual(0);
            expect(memoryStats.memory.totalKeys).toBe(3);
            expect(networkStats.requests.total).toBe(3);
        });

        test('should handle error scenarios across modules', async () => {
            const keys = ['sk-invalid'];
            const apiType = 'openai';

            // Mock API error
            global.fetch.mockRejectedValue(new Error('API Error'));

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                const slot = await adaptiveConcurrencyManager.acquireSlot();
                
                try {
                    await smartRetryManager.executeWithRetry(key, async () => {
                        throw new Error('API Error');
                    }, { apiType });
                } catch (error) {
                    enhancedMemoryManager.updateKeyStatus(key, 'error', {
                        error: error.message
                    });
                    return { key, status: 'error', error: error.message };
                } finally {
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: false });
                }
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(keys, apiType);

            expect(results[0].status).toBe('error');

            // All modules should have handled the error gracefully
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            const retryStats = smartRetryManager.getStats();
            const memoryStats = enhancedMemoryManager.getDetailedStats();

            expect(concurrencyStats.performance.totalRequests).toBe(1);
            expect(retryStats.totalRetries).toBeGreaterThan(0);
            expect(memoryStats.memory.totalKeys).toBe(1);
        });
    });

    describe('Performance Integration', () => {
        test('should maintain performance under integrated load', async () => {
            const keys = Array.from({length: 200}, (_, i) => `sk-load-${i}`);
            const apiType = 'openai';

            // Mock varying response times
            global.fetch.mockImplementation(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                })
            );

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                const slot = await adaptiveConcurrencyManager.acquireSlot();
                
                try {
                    const result = await smartRetryManager.executeWithRetry(key, async () => {
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
                        return { success: true };
                    }, { apiType });

                    enhancedMemoryManager.updateKeyStatus(key, 'valid');
                    return { key, status: 'valid' };
                } finally {
                    adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                }
            });

            const startTime = Date.now();
            const results = await highSpeedController.detectKeysAtHighSpeed(keys, apiType);
            const endTime = Date.now();

            expect(results.length).toBe(200);
            expect(endTime - startTime).toBeLessThan(10000); // Should complete in reasonable time

            // Check that adaptive optimizations occurred
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();
            expect(concurrencyStats.concurrency.max).toBeGreaterThan(5); // Should have scaled up
        });

        test('should handle resource contention gracefully', async () => {
            // Simulate high system load
            global.performance.memory.usedJSHeapSize = 40 * 1024 * 1024; // 40MB

            const keys = Array.from({length: 100}, (_, i) => `sk-contention-${i}`);
            
            // Multiple concurrent operations
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    highPerformanceProcessor.processBatch(keys.slice(i * 20, (i + 1) * 20), 
                        async (key) => {
                            const slot = await adaptiveConcurrencyManager.acquireSlot();
                            try {
                                enhancedMemoryManager.addKey({ key, status: 'processing' });
                                await new Promise(resolve => setTimeout(resolve, 10));
                                return { processed: true };
                            } finally {
                                adaptiveConcurrencyManager.releaseSlot(slot, { success: true });
                            }
                        }
                    )
                );
            }

            const results = await Promise.all(promises);

            // All operations should complete successfully
            expect(results.every(r => r.totalProcessed === 20)).toBe(true);

            // System should have adapted to resource constraints
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            expect(memoryStats.performance.cleanupCount).toBeGreaterThan(0);
        });
    });

    describe('Configuration Integration', () => {
        test('should coordinate configuration changes across modules', () => {
            const newConfig = {
                maxConcurrency: 20,
                maxRetries: 5,
                batchSize: 100,
                maxConnectionsPerHost: 10
            };

            // Update configurations
            adaptiveConcurrencyManager.updateConfig({ 
                maxConcurrency: newConfig.maxConcurrency 
            });
            smartRetryManager.updateConfig({ 
                maxRetries: newConfig.maxRetries 
            });
            highPerformanceProcessor.updateConfig({ 
                batchSize: newConfig.batchSize 
            });
            networkOptimizer.updateConfig({ 
                maxConnectionsPerHost: newConfig.maxConnectionsPerHost 
            });

            // Verify configurations were applied
            expect(adaptiveConcurrencyManager.config.maxConcurrency).toBe(20);
            expect(smartRetryManager.config.maxRetries).toBe(5);
            expect(highPerformanceProcessor.config.batchSize).toBe(100);
            expect(networkOptimizer.config.maxConnectionsPerHost).toBe(10);
        });

        test('should validate configuration compatibility', () => {
            // Test incompatible configurations
            expect(() => {
                adaptiveConcurrencyManager.updateConfig({ maxConcurrency: -1 });
            }).toThrow();

            expect(() => {
                smartRetryManager.updateConfig({ maxRetries: -1 });
            }).toThrow();

            expect(() => {
                highPerformanceProcessor.updateConfig({ batchSize: 0 });
            }).toThrow();
        });
    });

    describe('Cleanup Integration', () => {
        test('should cleanup all modules without conflicts', () => {
            // Add some state to modules
            enhancedMemoryManager.addKey({ key: 'sk-cleanup', status: 'pending' });
            adaptiveConcurrencyManager.acquireSlot();
            
            // Cleanup all modules
            expect(() => {
                highSpeedController.cleanup();
                adaptiveConcurrencyManager.cleanup();
                smartRetryManager.cleanup();
                enhancedMemoryManager.cleanup();
                highPerformanceProcessor.cleanup();
                networkOptimizer.cleanup();
            }).not.toThrow();

            // Verify clean state
            const memoryStats = enhancedMemoryManager.getDetailedStats();
            const concurrencyStats = adaptiveConcurrencyManager.getDetailedStats();

            expect(memoryStats.memory.totalKeys).toBe(0);
            expect(concurrencyStats.concurrency.current).toBe(0);
        });
    });
});
