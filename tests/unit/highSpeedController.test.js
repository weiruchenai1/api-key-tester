import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all required modules
vi.mock('../../js/core/adaptiveConcurrencyManager.js', () => ({
    default: {
        initialize: vi.fn(),
        cleanup: vi.fn(),
        getDetailedStats: vi.fn(() => ({ concurrency: { current: 0, max: 5 } }))
    }
}));

vi.mock('../../js/core/smartRetryManager.js', () => ({
    default: {
        initialize: vi.fn(),
        cleanup: vi.fn(),
        getStats: vi.fn(() => ({ totalRetries: 0 }))
    }
}));

// Mock console methods
global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

// Mock performance API
global.performance = {
    now: vi.fn(() => Date.now())
};

describe('HighSpeedController', () => {
    let controller;

    beforeEach(async () => {
        // Clear mocks
        vi.clearAllMocks();
        
        // Import the module
        const module = await import('../../js/core/highSpeedController.js');
        controller = global.highSpeedController;
        
        // Reset controller state
        if (controller) {
            controller.cleanup();
        }
    });

    afterEach(() => {
        if (controller) {
            controller.cleanup();
        }
    });

    describe('initialization', () => {
        test('should initialize with default config', async () => {
            await controller.initialize();
            
            expect(controller.isInitialized).toBe(true);
            expect(controller.config.maxConcurrency).toBe(50);
            expect(controller.config.statsUpdateInterval).toBe(1000);
        });

        test('should initialize all modules', async () => {
            await controller.initialize();
            
            expect(controller.modules.adaptiveConcurrencyManager).toBeDefined();
            expect(controller.modules.smartRetryManager).toBeDefined();
            expect(controller.modules.enhancedMemoryManager).toBeDefined();
            expect(controller.modules.highPerformanceProcessor).toBeDefined();
            expect(controller.modules.networkOptimizer).toBeDefined();
        });

        test('should handle initialization errors gracefully', async () => {
            // Mock module initialization failure
            const mockModule = {
                initialize: vi.fn().mockRejectedValue(new Error('Init failed'))
            };
            controller.modules.adaptiveConcurrencyManager = mockModule;

            await expect(controller.initialize()).resolves.not.toThrow();
            expect(controller.isInitialized).toBe(true);
        });
    });

    describe('high-speed detection', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should detect keys at high speed', async () => {
            const keys = ['sk-test1', 'sk-test2', 'sk-test3'];
            const apiType = 'openai';

            // Mock successful detection
            controller.detectSingleKey = vi.fn().mockResolvedValue({
                key: 'sk-test1',
                status: 'valid',
                model: 'gpt-4'
            });

            const results = await controller.detectKeysAtHighSpeed(keys, apiType);

            expect(results.length).toBe(3);
            expect(results.every(r => r.status)).toBe(true);
        });

        test('should handle detection errors gracefully', async () => {
            const keys = ['sk-invalid'];
            const apiType = 'openai';

            controller.detectSingleKey = vi.fn().mockRejectedValue(new Error('API error'));

            const results = await controller.detectKeysAtHighSpeed(keys, apiType);

            expect(results.length).toBe(1);
            expect(results[0].status).toBe('error');
        });

        test('should respect cancellation', async () => {
            const keys = Array.from({length: 100}, (_, i) => `sk-test-${i}`);
            const apiType = 'openai';

            controller.detectSingleKey = vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return { status: 'valid' };
            });

            const detectionPromise = controller.detectKeysAtHighSpeed(keys, apiType);
            
            // Cancel after short delay
            setTimeout(() => {
                controller.shouldStop = true;
            }, 50);

            const results = await detectionPromise;

            // Should have stopped early due to cancellation
            expect(results.length).toBeLessThan(100);
        });
    });

    describe('status monitoring', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should start status monitoring', () => {
            controller.startStatusMonitoring();
            
            expect(controller.statusMonitor.timer).toBeDefined();
        });

        test('should stop status monitoring on cleanup', () => {
            controller.startStatusMonitoring();
            const timerId = controller.statusMonitor.timer;
            
            controller.cleanup();
            
            expect(controller.statusMonitor.timer).toBeNull();
        });

        test('should handle status update errors', () => {
            controller.updateStatus = vi.fn().mockImplementation(() => {
                throw new Error('Status update error');
            });

            expect(() => {
                controller.startStatusMonitoring();
            }).not.toThrow();
        });

        test('should call status update callbacks', () => {
            const callback = vi.fn();
            controller.onStatusUpdate(callback);
            
            controller.updateStatus();
            
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('statistics and monitoring', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should provide detailed statistics', () => {
            const stats = controller.getDetailedStats();

            expect(stats.global).toBeDefined();
            expect(stats.modules).toBeDefined();
            expect(stats.performance).toBeDefined();
        });

        test('should track global performance metrics', () => {
            controller.globalStats.totalRequests = 100;
            controller.globalStats.successfulRequests = 95;

            const stats = controller.getDetailedStats();
            
            expect(stats.global.totalRequests).toBe(100);
            expect(stats.global.successRate).toBe(0.95);
        });

        test('should aggregate module statistics', () => {
            // Mock module stats
            controller.modules.adaptiveConcurrencyManager = {
                getDetailedStats: vi.fn(() => ({ concurrency: { current: 5, max: 10 } }))
            };

            const stats = controller.getDetailedStats();
            
            expect(stats.modules.adaptiveConcurrencyManager).toBeDefined();
        });
    });

    describe('configuration management', () => {
        test('should allow config updates', () => {
            const newConfig = {
                maxConcurrency: 100,
                statsUpdateInterval: 2000,
                enableOptimizations: false
            };

            controller.updateConfig(newConfig);

            expect(controller.config.maxConcurrency).toBe(100);
            expect(controller.config.statsUpdateInterval).toBe(2000);
            expect(controller.config.enableOptimizations).toBe(false);
        });

        test('should validate config values', () => {
            expect(() => {
                controller.updateConfig({ maxConcurrency: -1 });
            }).toThrow();

            expect(() => {
                controller.updateConfig({ statsUpdateInterval: 0 });
            }).toThrow();
        });

        test('should merge config with defaults', () => {
            const partialConfig = { maxConcurrency: 75 };
            
            controller.updateConfig(partialConfig);

            expect(controller.config.maxConcurrency).toBe(75);
            expect(controller.config.statsUpdateInterval).toBe(1000); // Should keep default
        });
    });

    describe('module integration', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should coordinate between modules', async () => {
            const keys = ['sk-test1', 'sk-test2'];
            const apiType = 'openai';

            // Mock module interactions
            controller.modules.enhancedMemoryManager = {
                addKey: vi.fn(),
                updateKeyStatus: vi.fn(),
                getKeysBatch: vi.fn(() => [])
            };

            controller.modules.adaptiveConcurrencyManager = {
                acquireSlot: vi.fn().mockResolvedValue({ id: 1 }),
                releaseSlot: vi.fn()
            };

            await controller.detectKeysAtHighSpeed(keys, apiType);

            expect(controller.modules.enhancedMemoryManager.addKey).toHaveBeenCalled();
            expect(controller.modules.adaptiveConcurrencyManager.acquireSlot).toHaveBeenCalled();
        });

        test('should handle module failures gracefully', async () => {
            const keys = ['sk-test1'];
            const apiType = 'openai';

            // Mock module failure
            controller.modules.adaptiveConcurrencyManager = {
                acquireSlot: vi.fn().mockRejectedValue(new Error('Concurrency error')),
                releaseSlot: vi.fn()
            };

            const results = await controller.detectKeysAtHighSpeed(keys, apiType);

            expect(results.length).toBe(1);
            // Should handle error gracefully
        });
    });

    describe('performance optimization', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should optimize based on performance metrics', () => {
            // Mock poor performance
            controller.globalStats.successRate = 0.5;
            controller.globalStats.avgResponseTime = 5000;

            controller.optimizePerformance();

            // Should have adjusted configuration for better performance
            expect(controller.config.maxConcurrency).toBeLessThan(50);
        });

        test('should scale up on good performance', () => {
            // Mock good performance
            controller.globalStats.successRate = 0.95;
            controller.globalStats.avgResponseTime = 200;

            controller.optimizePerformance();

            // Should have increased concurrency for better throughput
            expect(controller.config.maxConcurrency).toBeGreaterThan(50);
        });
    });

    describe('error handling and recovery', () => {
        test('should handle cleanup errors gracefully', () => {
            // Mock module cleanup error
            controller.modules.adaptiveConcurrencyManager = {
                cleanup: vi.fn().mockImplementation(() => {
                    throw new Error('Cleanup error');
                })
            };

            expect(() => {
                controller.cleanup();
            }).not.toThrow();
        });

        test('should reset state on cleanup', () => {
            controller.isInitialized = true;
            controller.isRunning = true;
            controller.shouldStop = true;

            controller.cleanup();

            expect(controller.isInitialized).toBe(false);
            expect(controller.isRunning).toBe(false);
            expect(controller.shouldStop).toBe(false);
        });

        test('should handle multiple cleanup calls', () => {
            expect(() => {
                controller.cleanup();
                controller.cleanup();
                controller.cleanup();
            }).not.toThrow();
        });
    });

    describe('memory management', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should monitor memory usage', () => {
            const memoryUsage = controller.getMemoryUsage();
            
            expect(memoryUsage).toBeDefined();
            expect(typeof memoryUsage.used).toBe('number');
            expect(typeof memoryUsage.total).toBe('number');
        });

        test('should trigger cleanup on high memory usage', () => {
            // Mock high memory usage
            global.performance.memory = {
                usedJSHeapSize: 90 * 1024 * 1024, // 90MB
                totalJSHeapSize: 100 * 1024 * 1024 // 100MB
            };

            controller.checkMemoryPressure();

            // Should have triggered memory optimization
            expect(controller.globalStats.memoryOptimizations).toBeGreaterThan(0);
        });
    });

    describe('event handling', () => {
        test('should register and call event callbacks', () => {
            const callback = vi.fn();
            
            controller.onStatusUpdate(callback);
            controller.updateStatus();

            expect(callback).toHaveBeenCalled();
        });

        test('should handle callback errors gracefully', () => {
            const errorCallback = vi.fn().mockImplementation(() => {
                throw new Error('Callback error');
            });

            controller.onStatusUpdate(errorCallback);

            expect(() => {
                controller.updateStatus();
            }).not.toThrow();
        });

        test('should support multiple callbacks', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            controller.onStatusUpdate(callback1);
            controller.onStatusUpdate(callback2);
            controller.updateStatus();

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });

    describe('integration scenarios', () => {
        beforeEach(async () => {
            await controller.initialize();
        });

        test('should handle large batch processing', async () => {
            const keys = Array.from({length: 1000}, (_, i) => `sk-batch-${i}`);
            const apiType = 'openai';

            controller.detectSingleKey = vi.fn().mockResolvedValue({
                status: 'valid',
                model: 'gpt-4'
            });

            const startTime = Date.now();
            const results = await controller.detectKeysAtHighSpeed(keys, apiType);
            const endTime = Date.now();

            expect(results.length).toBe(1000);
            expect(endTime - startTime).toBeLessThan(30000); // Should complete in reasonable time
        });

        test('should maintain performance under load', async () => {
            const keys = Array.from({length: 100}, (_, i) => `sk-load-${i}`);
            const apiType = 'openai';

            // Simulate varying response times
            controller.detectSingleKey = vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                return { status: 'valid' };
            });

            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(controller.detectKeysAtHighSpeed(keys, apiType));
            }

            const results = await Promise.all(promises);

            expect(results.every(batch => batch.length === 100)).toBe(true);
        });
    });
});
