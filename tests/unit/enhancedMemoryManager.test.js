import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

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

describe('EnhancedMemoryManager', () => {
    let manager;

    beforeEach(async () => {
        // Clear mocks
        vi.clearAllMocks();
        
        // Import the module
        const module = await import('../../js/core/enhancedMemoryManager.js');
        manager = global.enhancedMemoryManager;
        
        // Reset manager state
        if (manager) {
            manager.cleanup();
            await manager.initialize();
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
            expect(manager.config.maxMemoryUsage).toBe(100 * 1024 * 1024); // 100MB
            expect(manager.config.cleanupThreshold).toBe(0.8);
            expect(manager.config.batchSize).toBe(1000);
        });

        test('should load existing data from localStorage', () => {
            const mockData = JSON.stringify([
                { key: 'test-key', status: 'valid', timestamp: Date.now() }
            ]);
            localStorageMock.getItem.mockReturnValue(mockData);
            
            manager.loadFromStorage();
            
            const keys = manager.getKeysBatch({}, 10);
            expect(keys.length).toBe(1);
            expect(keys[0].key).toBe('test-key');
        });
    });

    describe('key management', () => {
        test('should add keys correctly', () => {
            const keyData = {
                key: 'sk-test123',
                status: 'pending',
                startTime: Date.now()
            };
            
            manager.addKey(keyData);
            
            const keys = manager.getKeysBatch({}, 10);
            expect(keys.length).toBe(1);
            expect(keys[0].key).toBe('sk-test123');
            expect(keys[0].status).toBe('pending');
        });

        test('should update key status', () => {
            manager.addKey({
                key: 'sk-test123',
                status: 'pending',
                startTime: Date.now()
            });
            
            manager.updateKeyStatus('sk-test123', 'valid', {
                model: 'gpt-4',
                responseTime: 150
            });
            
            const keys = manager.getKeysBatch({}, 10);
            expect(keys[0].status).toBe('valid');
            expect(keys[0].model).toBe('gpt-4');
            expect(keys[0].responseTime).toBe(150);
        });

        test('should handle duplicate keys', () => {
            const keyData = {
                key: 'sk-duplicate',
                status: 'pending',
                startTime: Date.now()
            };
            
            manager.addKey(keyData);
            manager.addKey(keyData); // Add same key again
            
            const keys = manager.getKeysBatch({}, 10);
            expect(keys.length).toBe(1); // Should not duplicate
        });

        test('should remove keys', () => {
            manager.addKey({
                key: 'sk-remove',
                status: 'pending',
                startTime: Date.now()
            });
            
            manager.removeKey('sk-remove');
            
            const keys = manager.getKeysBatch({}, 10);
            expect(keys.length).toBe(0);
        });
    });

    describe('batch operations', () => {
        beforeEach(() => {
            // Add test data
            for (let i = 0; i < 50; i++) {
                manager.addKey({
                    key: `sk-test-${i}`,
                    status: i % 3 === 0 ? 'valid' : i % 3 === 1 ? 'invalid' : 'pending',
                    startTime: Date.now() - (i * 1000)
                });
            }
        });

        test('should get keys in batches', () => {
            const batch1 = manager.getKeysBatch({}, 10);
            const batch2 = manager.getKeysBatch({}, 10, 10);
            
            expect(batch1.length).toBe(10);
            expect(batch2.length).toBe(10);
            expect(batch1[0].key).not.toBe(batch2[0].key);
        });

        test('should filter keys by status', () => {
            const validKeys = manager.getKeysBatch({ status: 'valid' }, 20);
            const invalidKeys = manager.getKeysBatch({ status: 'invalid' }, 20);
            
            expect(validKeys.every(k => k.status === 'valid')).toBe(true);
            expect(invalidKeys.every(k => k.status === 'invalid')).toBe(true);
        });

        test('should update multiple keys', () => {
            const keysToUpdate = ['sk-test-0', 'sk-test-1', 'sk-test-2'];
            
            manager.updateKeysBatch(keysToUpdate, 'processing', {
                batchId: 'batch-1'
            });
            
            keysToUpdate.forEach(key => {
                const keys = manager.getKeysBatch({ key }, 1);
                expect(keys[0].status).toBe('processing');
                expect(keys[0].batchId).toBe('batch-1');
            });
        });
    });

    describe('memory management', () => {
        test('should track memory usage', () => {
            // Add many keys to increase memory usage
            for (let i = 0; i < 1000; i++) {
                manager.addKey({
                    key: `sk-memory-test-${i}`,
                    status: 'pending',
                    data: new Array(100).fill('test-data'),
                    startTime: Date.now()
                });
            }
            
            const stats = manager.getDetailedStats();
            expect(stats.memory.totalKeys).toBe(1000);
            expect(stats.memory.estimatedUsage).toContain('MB');
        });

        test('should perform cleanup when threshold reached', () => {
            // Mock high memory usage
            global.performance.memory.usedJSHeapSize = manager.config.maxMemoryUsage * 0.9;
            
            // Add old keys
            const oldTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
            for (let i = 0; i < 100; i++) {
                manager.addKey({
                    key: `sk-old-${i}`,
                    status: 'valid',
                    startTime: oldTime,
                    lastAccess: oldTime
                });
            }
            
            const beforeCount = manager.getDetailedStats().memory.totalKeys;
            manager.performCleanup();
            const afterCount = manager.getDetailedStats().memory.totalKeys;
            
            expect(afterCount).toBeLessThan(beforeCount);
        });

        test('should compress data when needed', () => {
            const largeData = {
                key: 'sk-large',
                status: 'valid',
                data: new Array(1000).fill('large-data-item'),
                startTime: Date.now()
            };
            
            manager.addKey(largeData);
            
            // Trigger compression
            manager.compressData();
            
            const keys = manager.getKeysBatch({ key: 'sk-large' }, 1);
            expect(keys[0]).toBeDefined();
            // Data should still be accessible after compression
        });
    });

    describe('persistence', () => {
        test('should save to localStorage', () => {
            manager.addKey({
                key: 'sk-persist',
                status: 'valid',
                startTime: Date.now()
            });
            
            manager.saveToStorage();
            
            expect(localStorageMock.setItem).toHaveBeenCalled();
            const savedData = localStorageMock.setItem.mock.calls[0][1];
            expect(savedData).toContain('sk-persist');
        });

        test('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            expect(() => {
                manager.saveToStorage();
            }).not.toThrow();
        });

        test('should load corrupted data gracefully', () => {
            localStorageMock.getItem.mockReturnValue('invalid-json');
            
            expect(() => {
                manager.loadFromStorage();
            }).not.toThrow();
        });
    });

    describe('statistics and monitoring', () => {
        test('should provide detailed statistics', () => {
            // Add test data
            manager.addKey({ key: 'sk-1', status: 'valid', startTime: Date.now() });
            manager.addKey({ key: 'sk-2', status: 'invalid', startTime: Date.now() });
            manager.addKey({ key: 'sk-3', status: 'pending', startTime: Date.now() });
            
            const stats = manager.getDetailedStats();
            
            expect(stats.memory.totalKeys).toBe(3);
            expect(stats.memory.activeKeys).toBe(3);
            expect(stats.performance).toBeDefined();
            expect(stats.storage).toBeDefined();
        });

        test('should track access patterns', () => {
            manager.addKey({
                key: 'sk-access',
                status: 'valid',
                startTime: Date.now()
            });
            
            // Access the key multiple times
            manager.getKeysBatch({ key: 'sk-access' }, 1);
            manager.getKeysBatch({ key: 'sk-access' }, 1);
            
            const keys = manager.getKeysBatch({ key: 'sk-access' }, 1);
            expect(keys[0].accessCount).toBeGreaterThan(0);
        });
    });

    describe('background tasks', () => {
        test('should start and stop background tasks', () => {
            manager.startBackgroundTasks();
            expect(manager.backgroundTasks.cleanup).toBeDefined();
            
            manager.stopBackgroundTasks();
            expect(manager.backgroundTasks.cleanup).toBeNull();
        });

        test('should handle background task errors', () => {
            // Mock error in cleanup
            const originalCleanup = manager.performCleanup;
            manager.performCleanup = vi.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });
            
            expect(() => {
                manager.startBackgroundTasks();
            }).not.toThrow();
            
            // Restore original
            manager.performCleanup = originalCleanup;
        });
    });

    describe('configuration', () => {
        test('should allow config updates', () => {
            const newConfig = {
                maxMemoryUsage: 200 * 1024 * 1024, // 200MB
                cleanupThreshold: 0.9,
                batchSize: 2000
            };
            
            manager.updateConfig(newConfig);
            
            expect(manager.config.maxMemoryUsage).toBe(200 * 1024 * 1024);
            expect(manager.config.cleanupThreshold).toBe(0.9);
            expect(manager.config.batchSize).toBe(2000);
        });

        test('should validate config values', () => {
            expect(() => {
                manager.updateConfig({ maxMemoryUsage: -1 });
            }).toThrow();
            
            expect(() => {
                manager.updateConfig({ cleanupThreshold: 1.5 });
            }).toThrow();
        });
    });

    describe('error handling', () => {
        test('should handle invalid key data', () => {
            expect(() => {
                manager.addKey(null);
            }).not.toThrow();
            
            expect(() => {
                manager.addKey({ key: null });
            }).not.toThrow();
        });

        test('should handle cleanup errors gracefully', () => {
            expect(() => {
                manager.cleanup();
                manager.cleanup(); // Double cleanup
            }).not.toThrow();
        });
    });

    describe('performance optimization', () => {
        test('should handle large datasets efficiently', () => {
            const startTime = Date.now();
            
            // Add 10,000 keys
            for (let i = 0; i < 10000; i++) {
                manager.addKey({
                    key: `sk-perf-${i}`,
                    status: 'pending',
                    startTime: Date.now()
                });
            }
            
            const addTime = Date.now() - startTime;
            expect(addTime).toBeLessThan(5000); // Should complete in under 5 seconds
            
            // Test batch retrieval performance
            const retrieveStart = Date.now();
            const batch = manager.getKeysBatch({}, 1000);
            const retrieveTime = Date.now() - retrieveStart;
            
            expect(batch.length).toBe(1000);
            expect(retrieveTime).toBeLessThan(1000); // Should complete in under 1 second
        });

        test('should optimize memory usage with compression', () => {
            // Add keys with large data
            for (let i = 0; i < 100; i++) {
                manager.addKey({
                    key: `sk-compress-${i}`,
                    status: 'valid',
                    data: new Array(1000).fill(`data-${i}`),
                    startTime: Date.now()
                });
            }
            
            const beforeStats = manager.getDetailedStats();
            manager.compressData();
            const afterStats = manager.getDetailedStats();
            
            // Memory usage should be optimized after compression
            expect(afterStats.memory.totalKeys).toBe(beforeStats.memory.totalKeys);
        });
    });
});
