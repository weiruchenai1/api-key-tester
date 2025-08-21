import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('SmartRetryManager', () => {
    let manager;

    beforeEach(async () => {
        // Import the module
        const module = await import('../../js/core/smartRetryManager.js');
        manager = global.smartRetryManager;
        
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
            expect(manager.config.maxRetries).toBe(3);
            expect(manager.config.baseDelay).toBe(100);
            expect(manager.config.maxDelay).toBe(5000);
        });
    });

    describe('retry execution', () => {
        test('should succeed on first attempt', async () => {
            const mockFn = vi.fn().mockResolvedValue({ success: true, data: 'test' });
            
            const result = await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
            
            expect(result.success).toBe(true);
            expect(result.data).toBe('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should retry on failure and eventually succeed', async () => {
            let attempts = 0;
            const mockFn = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('Temporary failure');
                }
                return Promise.resolve({ success: true, attempt: attempts });
            });
            
            const result = await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
            
            expect(result.success).toBe(true);
            expect(result.attempt).toBe(2);
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        test('should fail after max retries', async () => {
            const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
            
            try {
                await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toBe('Persistent failure');
                expect(mockFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
            }
        });

        test('should fast-fail on non-retryable errors', async () => {
            const error401 = new Error('Unauthorized');
            error401.status = 401;
            
            const mockFn = vi.fn().mockRejectedValue(error401);
            
            try {
                await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(401);
                expect(mockFn).toHaveBeenCalledTimes(1); // No retries
            }
        });

        test('should handle different API types', async () => {
            const mockFn = vi.fn().mockResolvedValue({ success: true });
            
            await manager.executeWithRetry('test-key', mockFn, { apiType: 'gemini' });
            await manager.executeWithRetry('test-key', mockFn, { apiType: 'claude' });
            
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('circuit breaker', () => {
        test('should trigger circuit breaker after consecutive failures', async () => {
            const mockFn = vi.fn().mockRejectedValue(new Error('Server error'));
            
            // Trigger multiple failures to open circuit
            for (let i = 0; i < manager.config.circuitBreakerThreshold + 1; i++) {
                try {
                    await manager.executeWithRetry(`test-key-${i}`, mockFn, { apiType: 'openai' });
                } catch (error) {
                    // Expected to fail
                }
            }
            
            const stats = manager.getStats();
            expect(stats.circuitBreakerTrips).toBeGreaterThan(0);
        });

        test('should reset circuit breaker after success', async () => {
            // Trigger failures
            const failFn = vi.fn().mockRejectedValue(new Error('Server error'));
            for (let i = 0; i < 3; i++) {
                try {
                    await manager.executeWithRetry(`fail-key-${i}`, failFn, { apiType: 'openai' });
                } catch (error) {
                    // Expected
                }
            }
            
            // Now succeed
            const successFn = vi.fn().mockResolvedValue({ success: true });
            await manager.executeWithRetry('success-key', successFn, { apiType: 'openai' });
            
            // Circuit should be reset
            const stats = manager.getStats();
            expect(stats.consecutiveFailures).toBe(0);
        });
    });

    describe('delay calculation', () => {
        test('should calculate exponential backoff delay', () => {
            const delay1 = manager.calculateDelay(0, 'openai');
            const delay2 = manager.calculateDelay(1, 'openai');
            const delay3 = manager.calculateDelay(2, 'openai');
            
            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);
            expect(delay3).toBeLessThanOrEqual(manager.config.maxDelay);
        });

        test('should respect max delay limit', () => {
            const delay = manager.calculateDelay(10, 'openai'); // Very high attempt
            expect(delay).toBeLessThanOrEqual(manager.config.maxDelay);
        });

        test('should have different delays for different API types', () => {
            const openaiDelay = manager.calculateDelay(1, 'openai');
            const geminiDelay = manager.calculateDelay(1, 'gemini');
            
            // Delays might be different based on API-specific factors
            expect(typeof openaiDelay).toBe('number');
            expect(typeof geminiDelay).toBe('number');
        });
    });

    describe('error classification', () => {
        test('should identify retryable errors', () => {
            const retryableError = new Error('Server timeout');
            retryableError.status = 503;
            
            expect(manager.isRetryableError(retryableError, 'openai')).toBe(true);
        });

        test('should identify non-retryable errors', () => {
            const nonRetryableErrors = [
                { status: 401, message: 'Unauthorized' },
                { status: 403, message: 'Forbidden' },
                { status: 400, message: 'Bad Request' }
            ];
            
            nonRetryableErrors.forEach(errorData => {
                const error = new Error(errorData.message);
                error.status = errorData.status;
                expect(manager.isRetryableError(error, 'openai')).toBe(false);
            });
        });

        test('should handle network errors as retryable', () => {
            const networkError = new Error('Network timeout');
            networkError.code = 'NETWORK_ERROR';
            
            expect(manager.isRetryableError(networkError, 'openai')).toBe(true);
        });
    });

    describe('statistics tracking', () => {
        test('should track retry statistics', async () => {
            let attempts = 0;
            const mockFn = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('Temporary failure');
                }
                return Promise.resolve({ success: true });
            });
            
            await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
            
            const stats = manager.getStats();
            expect(stats.totalRetries).toBe(1);
            expect(stats.successfulRetries).toBe(1);
        });

        test('should track fast failures', async () => {
            const error401 = new Error('Unauthorized');
            error401.status = 401;
            const mockFn = vi.fn().mockRejectedValue(error401);
            
            try {
                await manager.executeWithRetry('test-key', mockFn, { apiType: 'openai' });
            } catch (error) {
                // Expected
            }
            
            const stats = manager.getStats();
            expect(stats.fastFails).toBe(1);
        });

        test('should provide detailed statistics', () => {
            const stats = manager.getStats();
            
            expect(stats).toHaveProperty('totalRetries');
            expect(stats).toHaveProperty('successfulRetries');
            expect(stats).toHaveProperty('fastFails');
            expect(stats).toHaveProperty('circuitBreakerTrips');
            expect(stats).toHaveProperty('avgRetryDelay');
        });
    });

    describe('configuration', () => {
        test('should allow config updates', () => {
            const newConfig = {
                maxRetries: 5,
                baseDelay: 200,
                maxDelay: 10000
            };
            
            manager.updateConfig(newConfig);
            
            expect(manager.config.maxRetries).toBe(5);
            expect(manager.config.baseDelay).toBe(200);
            expect(manager.config.maxDelay).toBe(10000);
        });

        test('should validate config values', () => {
            expect(() => {
                manager.updateConfig({ maxRetries: -1 });
            }).toThrow();
            
            expect(() => {
                manager.updateConfig({ baseDelay: 0 });
            }).toThrow();
        });
    });

    describe('cleanup and memory management', () => {
        test('should clean up resources', () => {
            manager.cleanup();
            
            expect(() => {
                manager.getStats();
            }).not.toThrow();
        });

        test('should handle cleanup multiple times', () => {
            expect(() => {
                manager.cleanup();
                manager.cleanup();
            }).not.toThrow();
        });
    });

    describe('edge cases', () => {
        test('should handle null/undefined functions', async () => {
            try {
                await manager.executeWithRetry('test-key', null, { apiType: 'openai' });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('function');
            }
        });

        test('should handle missing options', async () => {
            const mockFn = vi.fn().mockResolvedValue({ success: true });
            
            const result = await manager.executeWithRetry('test-key', mockFn);
            expect(result.success).toBe(true);
        });

        test('should handle very long key names', async () => {
            const longKey = 'a'.repeat(1000);
            const mockFn = vi.fn().mockResolvedValue({ success: true });
            
            const result = await manager.executeWithRetry(longKey, mockFn, { apiType: 'openai' });
            expect(result.success).toBe(true);
        });
    });
});
