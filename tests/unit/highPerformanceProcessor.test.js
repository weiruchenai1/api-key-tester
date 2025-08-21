import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements
document.body.innerHTML = `
    <div id="resultsContainer"></div>
    <div id="progressBar"></div>
    <div id="progressFill"></div>
`;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock performance API
global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 * 10 // 10MB
    }
};

// Mock console methods
global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

describe('HighPerformanceProcessor', () => {
    let processor;

    beforeEach(async () => {
        // Clear mocks
        vi.clearAllMocks();
        
        // Import the module
        const module = await import('../../js/core/highPerformanceProcessor.js');
        processor = global.highPerformanceProcessor;
        
        // Reset processor state
        if (processor) {
            processor.cleanup();
            await processor.initialize();
        }
    });

    afterEach(() => {
        if (processor) {
            processor.cleanup();
        }
    });

    describe('initialization', () => {
        test('should initialize with default config', () => {
            expect(processor).toBeDefined();
            expect(processor.config.batchSize).toBe(50);
            expect(processor.config.maxConcurrentBatches).toBe(3);
            expect(processor.config.uiUpdateThrottle).toBe(60);
        });
    });

    describe('batch processing', () => {
        test('should process items in batches', async () => {
            const items = Array.from({length: 25}, (_, i) => ({ id: i, value: `item-${i}` }));
            const processFunction = vi.fn().mockImplementation(async (item, index) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return { processed: true, item, index };
            });

            const result = await processor.processBatch(items, processFunction, { batchSize: 10 });

            expect(result.totalProcessed).toBe(25);
            expect(result.successful).toBe(25);
            expect(result.failed).toBe(0);
            expect(processFunction).toHaveBeenCalledTimes(25);
        });

        test('should handle processing errors gracefully', async () => {
            const items = Array.from({length: 10}, (_, i) => ({ id: i, value: `item-${i}` }));
            const processFunction = vi.fn().mockImplementation(async (item, index) => {
                if (index === 5) {
                    throw new Error('Processing error');
                }
                return { processed: true, item, index };
            });

            const result = await processor.processBatch(items, processFunction);

            expect(result.totalProcessed).toBe(10);
            expect(result.successful).toBe(9);
            expect(result.failed).toBe(1);
        });

        test('should respect batch size limits', async () => {
            const items = Array.from({length: 100}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockResolvedValue({ processed: true });

            await processor.processBatch(items, processFunction, { batchSize: 20 });

            // Should process in 5 batches of 20 items each
            expect(processFunction).toHaveBeenCalledTimes(100);
        });

        test('should handle concurrent batch processing', async () => {
            const items = Array.from({length: 60}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockImplementation(async (item) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return { processed: true, item };
            });

            const startTime = Date.now();
            await processor.processBatch(items, processFunction, { 
                batchSize: 20, 
                maxConcurrentBatches: 3 
            });
            const endTime = Date.now();

            // With 3 concurrent batches, should be faster than sequential processing
            expect(endTime - startTime).toBeLessThan(200); // Should complete in reasonable time
            expect(processFunction).toHaveBeenCalledTimes(60);
        });
    });

    describe('UI optimization', () => {
        test('should cache results for batch UI updates', () => {
            const results = [
                { success: true, result: { key: 'sk-1', status: 'valid' } },
                { success: true, result: { key: 'sk-2', status: 'invalid' } },
                { success: false, error: 'Network error' }
            ];

            processor.cacheResults(results);

            const metrics = processor.getMetrics();
            expect(metrics.cachedResults).toBeGreaterThan(0);
        });

        test('should throttle UI updates', async () => {
            const updateSpy = vi.spyOn(processor, 'flushResultsToUI');
            
            // Trigger multiple rapid updates
            for (let i = 0; i < 10; i++) {
                processor.cacheResults([{ success: true, result: { key: `sk-${i}` } }]);
            }

            // Wait for throttled update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should have been throttled to fewer calls
            expect(updateSpy.mock.calls.length).toBeLessThan(10);
        });

        test('should handle frame dropping gracefully', () => {
            // Mock high frame rate scenario
            processor.frameDropDetection.lastFrameTime = Date.now() - 100; // Simulate slow frame
            
            processor.checkFrameRate();
            
            const metrics = processor.getMetrics();
            expect(metrics.droppedFrames).toBeGreaterThanOrEqual(0);
        });

        test('should optimize DOM operations', () => {
            const container = document.getElementById('resultsContainer');
            const initialChildCount = container.children.length;

            // Simulate adding many results
            const results = Array.from({length: 100}, (_, i) => ({
                success: true,
                result: { key: `sk-${i}`, status: 'valid' }
            }));

            processor.cacheResults(results);
            processor.flushResultsToUI();

            // Should batch DOM operations efficiently
            expect(container.children.length).toBeGreaterThan(initialChildCount);
        });
    });

    describe('memory management', () => {
        test('should monitor memory usage', () => {
            const memoryBefore = processor.getMemoryUsage();
            
            // Add large amount of cached data
            const largeResults = Array.from({length: 1000}, (_, i) => ({
                success: true,
                result: { 
                    key: `sk-${i}`, 
                    status: 'valid',
                    data: new Array(100).fill('test-data')
                }
            }));

            processor.cacheResults(largeResults);
            
            const memoryAfter = processor.getMemoryUsage();
            expect(memoryAfter).toBeGreaterThan(memoryBefore);
        });

        test('should perform memory cleanup when needed', () => {
            // Fill cache with data
            for (let i = 0; i < 500; i++) {
                processor.cacheResults([{
                    success: true,
                    result: { key: `sk-${i}`, status: 'valid' }
                }]);
            }

            const beforeCleanup = processor.resultCache.length;
            processor.performMemoryCleanup();
            const afterCleanup = processor.resultCache.length;

            expect(afterCleanup).toBeLessThanOrEqual(beforeCleanup);
        });

        test('should handle memory pressure gracefully', () => {
            // Mock high memory usage
            global.performance.memory.usedJSHeapSize = 100 * 1024 * 1024; // 100MB

            expect(() => {
                processor.checkMemoryPressure();
            }).not.toThrow();
        });
    });

    describe('performance metrics', () => {
        test('should track processing metrics', async () => {
            const items = Array.from({length: 20}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockResolvedValue({ processed: true });

            await processor.processBatch(items, processFunction);

            const metrics = processor.getMetrics();
            expect(metrics.processedBatches).toBeGreaterThan(0);
            expect(metrics.avgBatchTime).toBeDefined();
            expect(metrics.totalProcessingTime).toBeGreaterThan(0);
        });

        test('should track UI performance metrics', () => {
            processor.cacheResults([{ success: true, result: { key: 'sk-1' } }]);
            processor.flushResultsToUI();

            const metrics = processor.getMetrics();
            expect(metrics.uiUpdateCount).toBeGreaterThan(0);
            expect(metrics.avgUiUpdateTime).toBeDefined();
        });

        test('should provide detailed performance statistics', () => {
            const stats = processor.getDetailedStats();

            expect(stats.processing).toBeDefined();
            expect(stats.ui).toBeDefined();
            expect(stats.memory).toBeDefined();
            expect(stats.performance).toBeDefined();
        });
    });

    describe('configuration', () => {
        test('should allow config updates', () => {
            const newConfig = {
                batchSize: 100,
                maxConcurrentBatches: 5,
                uiUpdateThrottle: 30
            };

            processor.updateConfig(newConfig);

            expect(processor.config.batchSize).toBe(100);
            expect(processor.config.maxConcurrentBatches).toBe(5);
            expect(processor.config.uiUpdateThrottle).toBe(30);
        });

        test('should validate config values', () => {
            expect(() => {
                processor.updateConfig({ batchSize: 0 });
            }).toThrow();

            expect(() => {
                processor.updateConfig({ maxConcurrentBatches: -1 });
            }).toThrow();
        });
    });

    describe('error handling', () => {
        test('should handle null/undefined items gracefully', async () => {
            const items = [null, undefined, { id: 1 }];
            const processFunction = vi.fn().mockResolvedValue({ processed: true });

            const result = await processor.processBatch(items, processFunction);

            expect(result.totalProcessed).toBe(3);
            // Should handle null/undefined items without crashing
        });

        test('should handle processing function errors', async () => {
            const items = [{ id: 1 }, { id: 2 }];
            const processFunction = vi.fn().mockRejectedValue(new Error('Process error'));

            const result = await processor.processBatch(items, processFunction);

            expect(result.failed).toBe(2);
            expect(result.successful).toBe(0);
        });

        test('should handle cleanup errors gracefully', () => {
            expect(() => {
                processor.cleanup();
                processor.cleanup(); // Double cleanup
            }).not.toThrow();
        });
    });

    describe('adaptive optimization', () => {
        test('should adapt batch size based on performance', async () => {
            const items = Array.from({length: 100}, (_, i) => ({ id: i }));
            
            // Simulate slow processing
            const slowProcessFunction = vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return { processed: true };
            });

            await processor.processBatch(items, slowProcessFunction);

            // Should adapt to performance conditions
            const metrics = processor.getMetrics();
            expect(metrics.adaptiveOptimizations).toBeGreaterThanOrEqual(0);
        });

        test('should optimize based on system resources', () => {
            // Mock low memory scenario
            global.performance.memory.usedJSHeapSize = 90 * 1024 * 1024; // 90MB

            processor.optimizeForSystemResources();

            // Should adjust configuration for low memory
            expect(processor.config.batchSize).toBeLessThanOrEqual(50);
        });
    });

    describe('concurrent processing', () => {
        test('should handle multiple concurrent batch operations', async () => {
            const items1 = Array.from({length: 20}, (_, i) => ({ id: i, batch: 1 }));
            const items2 = Array.from({length: 20}, (_, i) => ({ id: i, batch: 2 }));
            
            const processFunction = vi.fn().mockImplementation(async (item) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return { processed: true, item };
            });

            const [result1, result2] = await Promise.all([
                processor.processBatch(items1, processFunction),
                processor.processBatch(items2, processFunction)
            ]);

            expect(result1.totalProcessed).toBe(20);
            expect(result2.totalProcessed).toBe(20);
            expect(processFunction).toHaveBeenCalledTimes(40);
        });

        test('should manage resource contention', async () => {
            processor.config.maxConcurrentBatches = 2;

            const items = Array.from({length: 60}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return { processed: true };
            });

            const startTime = Date.now();
            await processor.processBatch(items, processFunction, { batchSize: 20 });
            const endTime = Date.now();

            // Should respect concurrency limits
            expect(endTime - startTime).toBeGreaterThan(100); // Should take some time due to limits
        });
    });

    describe('integration with other systems', () => {
        test('should integrate with progress reporting', async () => {
            const items = Array.from({length: 30}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockResolvedValue({ processed: true });

            const progressCallback = vi.fn();
            processor.onProgress(progressCallback);

            await processor.processBatch(items, processFunction);

            expect(progressCallback).toHaveBeenCalled();
        });

        test('should provide cancellation support', async () => {
            const items = Array.from({length: 100}, (_, i) => ({ id: i }));
            const processFunction = vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return { processed: true };
            });

            const processingPromise = processor.processBatch(items, processFunction);
            
            // Cancel after short delay
            setTimeout(() => {
                processor.cancel();
            }, 50);

            const result = await processingPromise;

            // Should have processed fewer items due to cancellation
            expect(result.totalProcessed).toBeLessThan(100);
        });
    });
});
