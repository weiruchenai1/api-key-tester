import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements
document.body.innerHTML = `<div id="progressFill" style="width:0%"></div>`;

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

describe('AdaptiveConcurrencyManager', () => {
    let manager;

    beforeEach(async () => {
        // Import the module
        const module = await import('../../js/core/adaptiveConcurrencyManager.js');
        manager = global.adaptiveConcurrencyManager;
        
        // Reset manager state
        if (manager) {
            manager.cleanup();
            if (manager.initialize) {
                await manager.initialize();
            }
        }
    });

    afterEach(() => {
        if (manager) {
            manager.cleanup();
        }
    });

    describe('initialization', () => {
        test('should initialize with default config', () => {
            expect(manager).toBeDefined();
            expect(manager.config.minConcurrency).toBe(1);
            expect(manager.config.maxConcurrency).toBe(100);
            expect(manager.config.initialConcurrency).toBe(5);
        });

        test('should start with initial concurrency', () => {
            const stats = manager.getDetailedStats();
            expect(stats.concurrency.max).toBe(5);
        });
    });

    describe('slot management', () => {
        test('should acquire and release slots', async () => {
            const slot = await manager.acquireSlot();
            
            expect(slot).toBeDefined();
            expect(slot.id).toBeDefined();
            expect(slot.acquireTime).toBeDefined();
            
            const statsBefore = manager.getDetailedStats();
            expect(statsBefore.concurrency.current).toBe(1);
            
            manager.releaseSlot(slot, { success: true });
            
            const statsAfter = manager.getDetailedStats();
            expect(statsAfter.concurrency.current).toBe(0);
        });

        test('should respect max concurrency limit', async () => {
            manager.config.maxConcurrency = 2;
            
            const slot1 = await manager.acquireSlot();
            const slot2 = await manager.acquireSlot();
            
            expect(slot1).toBeDefined();
            expect(slot2).toBeDefined();
            
            const stats = manager.getDetailedStats();
            expect(stats.concurrency.current).toBe(2);
        });

        test('should handle slot release with performance data', async () => {
            const slot = await manager.acquireSlot();
            
            manager.releaseSlot(slot, {
                success: true,
                responseTime: 150,
                isRateLimit: false
            });
            
            const stats = manager.getDetailedStats();
            expect(stats.performance.totalRequests).toBe(1);
            expect(stats.performance.successfulRequests).toBe(1);
        });
    });

    describe('adaptive scaling', () => {
        test('should increase concurrency on good performance', async () => {
            const initialMax = manager.config.maxConcurrency;
            
            // Simulate multiple successful fast requests
            for (let i = 0; i < 10; i++) {
                const slot = await manager.acquireSlot();
                manager.releaseSlot(slot, {
                    success: true,
                    responseTime: 50,
                    isRateLimit: false
                });
            }
            
            // Trigger adaptation
            manager.adaptConcurrency();
            
            const stats = manager.getDetailedStats();
            expect(stats.concurrency.max).toBeGreaterThanOrEqual(initialMax);
        });

        test('should decrease concurrency on poor performance', async () => {
            // Set initial concurrency higher
            manager.stats.concurrency.max = 10;
            
            // Simulate multiple failed or slow requests
            for (let i = 0; i < 10; i++) {
                const slot = await manager.acquireSlot();
                manager.releaseSlot(slot, {
                    success: false,
                    responseTime: 2000,
                    isRateLimit: true
                });
            }
            
            // Trigger adaptation
            manager.adaptConcurrency();
            
            const stats = manager.getDetailedStats();
            expect(stats.concurrency.max).toBeLessThan(10);
        });

        test('should respect min/max concurrency bounds', async () => {
            manager.config.minConcurrency = 2;
            manager.config.maxConcurrency = 8;
            
            // Force very low concurrency
            manager.stats.concurrency.max = 1;
            manager.adaptConcurrency();
            
            let stats = manager.getDetailedStats();
            expect(stats.concurrency.max).toBeGreaterThanOrEqual(2);
            
            // Force very high concurrency
            manager.stats.concurrency.max = 100;
            manager.adaptConcurrency();
            
            stats = manager.getDetailedStats();
            expect(stats.concurrency.max).toBeLessThanOrEqual(8);
        });
    });

    describe('performance tracking', () => {
        test('should track success rate correctly', async () => {
            // 3 successful, 2 failed
            for (let i = 0; i < 3; i++) {
                const slot = await manager.acquireSlot();
                manager.releaseSlot(slot, { success: true });
            }
            
            for (let i = 0; i < 2; i++) {
                const slot = await manager.acquireSlot();
                manager.releaseSlot(slot, { success: false });
            }
            
            const stats = manager.getDetailedStats();
            expect(stats.performance.successRate).toBe(0.6); // 3/5
        });

        test('should track average response time', async () => {
            const responseTimes = [100, 200, 300];
            
            for (const time of responseTimes) {
                const slot = await manager.acquireSlot();
                manager.releaseSlot(slot, {
                    success: true,
                    responseTime: time
                });
            }
            
            const stats = manager.getDetailedStats();
            expect(stats.performance.avgResponseTime).toBe(200); // (100+200+300)/3
        });

        test('should track rate limit occurrences', async () => {
            const slot1 = await manager.acquireSlot();
            manager.releaseSlot(slot1, { success: false, isRateLimit: true });
            
            const slot2 = await manager.acquireSlot();
            manager.releaseSlot(slot2, { success: true, isRateLimit: false });
            
            const stats = manager.getDetailedStats();
            expect(stats.performance.rateLimitHits).toBe(1);
        });
    });

    describe('queue management', () => {
        test('should handle queue when at max concurrency', async () => {
            manager.config.maxConcurrency = 1;
            
            const slot1 = await manager.acquireSlot();
            expect(slot1).toBeDefined();
            
            // Second request should be queued
            const slot2Promise = manager.acquireSlot();
            
            // Release first slot
            manager.releaseSlot(slot1, { success: true });
            
            // Second slot should now be available
            const slot2 = await slot2Promise;
            expect(slot2).toBeDefined();
        });

        test('should process queue in order', async () => {
            manager.config.maxConcurrency = 1;
            
            const results = [];
            const slot1 = await manager.acquireSlot();
            
            // Queue multiple requests
            const promises = [];
            for (let i = 0; i < 3; i++) {
                promises.push(
                    manager.acquireSlot().then(slot => {
                        results.push(i);
                        manager.releaseSlot(slot, { success: true });
                        return slot;
                    })
                );
            }
            
            // Release first slot to start processing queue
            manager.releaseSlot(slot1, { success: true });
            
            await Promise.all(promises);
            expect(results).toEqual([0, 1, 2]);
        });
    });

    describe('error handling', () => {
        test('should handle invalid slot release gracefully', () => {
            expect(() => {
                manager.releaseSlot(null, { success: true });
            }).not.toThrow();
            
            expect(() => {
                manager.releaseSlot({ id: 'invalid' }, { success: true });
            }).not.toThrow();
        });

        test('should handle cleanup without errors', () => {
            expect(() => {
                manager.cleanup();
            }).not.toThrow();
        });

        test('should handle stats calculation with no data', async () => {
            const module = await import('../../js/core/adaptiveConcurrencyManager.js');
            const newManager = new module.AdaptiveConcurrencyManager();
            
            const stats = newManager.getDetailedStats();
            expect(stats.performance.successRate).toBe(0);
            expect(stats.performance.avgResponseTime).toBe(0);
        });
    });

    describe('memory management', () => {
        test('should clean up old performance data', async () => {
            // Add old performance data
            const oldTime = Date.now() - (manager.config.performanceWindow + 1000);
            manager.performanceHistory.push({
                timestamp: oldTime,
                success: true,
                responseTime: 100
            });
            
            // Add recent data
            const slot = await manager.acquireSlot();
            manager.releaseSlot(slot, {
                success: true,
                responseTime: 150
            });
            
            // Trigger cleanup
            manager.cleanupOldData();
            
            // Old data should be removed
            const hasOldData = manager.performanceHistory.some(
                entry => entry.timestamp === oldTime
            );
            expect(hasOldData).toBe(false);
        });
    });

    describe('configuration', () => {
        test('should allow config updates', () => {
            const newConfig = {
                maxConcurrency: 20,
                minConcurrency: 3,
                adaptationThreshold: 15
            };
            
            manager.updateConfig(newConfig);
            
            expect(manager.config.maxConcurrency).toBe(20);
            expect(manager.config.minConcurrency).toBe(3);
            expect(manager.config.adaptationThreshold).toBe(15);
        });

        test('should validate config values', () => {
            expect(() => {
                manager.updateConfig({ maxConcurrency: -1 });
            }).toThrow();
            
            expect(() => {
                manager.updateConfig({ minConcurrency: 0 });
            }).toThrow();
        });
    });
});
