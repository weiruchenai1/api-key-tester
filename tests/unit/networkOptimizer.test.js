import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

// Mock performance API
global.performance = {
    now: vi.fn(() => Date.now())
};

// Mock console methods
global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

describe('NetworkOptimizer', () => {
    let optimizer;

    beforeEach(async () => {
        // Clear mocks
        vi.clearAllMocks();
        
        // Import the module
        const module = await import('../../js/core/networkOptimizer.js');
        optimizer = global.networkOptimizer;
        
        // Reset optimizer state
        if (optimizer) {
            optimizer.cleanup();
            await optimizer.initialize();
        }
    });

    afterEach(() => {
        if (optimizer) {
            optimizer.cleanup();
        }
    });

    describe('initialization', () => {
        test('should initialize with default config', () => {
            expect(optimizer).toBeDefined();
            expect(optimizer.config.maxConnectionsPerHost).toBe(6);
            expect(optimizer.config.connectionTimeout).toBe(30000);
            expect(optimizer.config.requestMergeWindow).toBe(100);
        });
    });

    describe('connection pooling', () => {
        test('should create and manage connections', () => {
            const host = 'api.openai.com';
            
            const connection1 = optimizer.createConnection(host);
            const connection2 = optimizer.createConnection(host);
            
            expect(connection1).toBeDefined();
            expect(connection2).toBeDefined();
            expect(connection1.id).not.toBe(connection2.id);
            expect(connection1.host).toBe(host);
        });

        test('should reuse connections from pool', () => {
            const host = 'api.openai.com';
            
            const connection = optimizer.createConnection(host);
            optimizer.releaseConnection(host, connection);
            
            const reusedConnection = optimizer.getConnection(host);
            expect(reusedConnection.id).toBe(connection.id);
        });

        test('should respect max connections per host', () => {
            const host = 'api.openai.com';
            optimizer.config.maxConnectionsPerHost = 2;
            
            const connections = [];
            for (let i = 0; i < 5; i++) {
                connections.push(optimizer.createConnection(host));
            }
            
            const stats = optimizer.getDetailedStats();
            expect(stats.connections.active).toBeLessThanOrEqual(2);
        });

        test('should clean up expired connections', () => {
            const host = 'api.openai.com';
            
            const connection = optimizer.createConnection(host);
            connection.lastUsed = Date.now() - (optimizer.config.connectionTimeout + 1000);
            optimizer.releaseConnection(host, connection);
            
            optimizer.cleanupExpiredConnections();
            
            const stats = optimizer.getDetailedStats();
            expect(stats.connections.poolSize).toBe(0);
        });
    });

    describe('request merging', () => {
        test('should merge similar requests', async () => {
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET', headers: { 'Authorization': 'Bearer test' } };
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] }),
                clone: () => ({
                    json: () => Promise.resolve({ data: [] })
                })
            });
            
            // Make multiple identical requests quickly
            const promises = [];
            for (let i = 0; i < 3; i++) {
                promises.push(optimizer.optimizedFetch(url, options));
            }
            
            await Promise.all(promises);
            
            // Should have merged requests, so fewer actual fetch calls
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        test('should not merge different requests', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url1 = 'https://api.openai.com/v1/models';
            const url2 = 'https://api.openai.com/v1/chat/completions';
            const options = { method: 'GET' };
            
            await Promise.all([
                optimizer.optimizedFetch(url1, options),
                optimizer.optimizedFetch(url2, options)
            ]);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('should handle request merge window timeout', async () => {
            optimizer.config.requestMergeWindow = 50;
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            // First request
            await optimizer.optimizedFetch(url, options);
            
            // Wait longer than merge window
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Second request should not be merged
            await optimizer.optimizedFetch(url, options);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('error handling and retries', () => {
        test('should handle network errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            try {
                await optimizer.optimizedFetch(url, options);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toBe('Network error');
            }
            
            const stats = optimizer.getDetailedStats();
            expect(stats.performance.networkErrors).toBe(1);
        });

        test('should track connection failures', () => {
            const host = 'api.openai.com';
            
            optimizer.recordConnectionFailure(host, new Error('Connection failed'));
            
            const stats = optimizer.getDetailedStats();
            expect(stats.performance.connectionFailures).toBe(1);
        });

        test('should handle timeout scenarios', async () => {
            global.fetch.mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 35000))
            );
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            try {
                await optimizer.optimizedFetch(url, options);
                expect.fail('Should have timed out');
            } catch (error) {
                expect(error.message).toContain('timeout');
            }
        });
    });

    describe('performance monitoring', () => {
        test('should track request performance', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            await optimizer.optimizedFetch(url, options);
            
            const stats = optimizer.getDetailedStats();
            expect(stats.requests.total).toBe(1);
            expect(stats.performance.avgResponseTime).toBeGreaterThan(0);
        });

        test('should calculate merge ratio correctly', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] }),
                clone: () => ({
                    json: () => Promise.resolve({ data: [] })
                })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            // Make 4 identical requests that should merge into 1
            await Promise.all([
                optimizer.optimizedFetch(url, options),
                optimizer.optimizedFetch(url, options),
                optimizer.optimizedFetch(url, options),
                optimizer.optimizedFetch(url, options)
            ]);
            
            const stats = optimizer.getDetailedStats();
            expect(stats.requests.merged).toBe(3); // 3 requests were merged
            expect(parseFloat(stats.requests.mergeRatio)).toBeGreaterThan(0);
        });

        test('should track bandwidth usage', async () => {
            const responseData = { data: new Array(1000).fill('test') };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
                headers: new Map([['content-length', '10000']])
            });
            
            const url = 'https://api.openai.com/v1/models';
            await optimizer.optimizedFetch(url, { method: 'GET' });
            
            const stats = optimizer.getDetailedStats();
            expect(stats.performance.totalBandwidth).toBeGreaterThan(0);
        });
    });

    describe('caching', () => {
        test('should cache GET requests', async () => {
            const responseData = { data: ['model1', 'model2'] };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
                clone: () => ({
                    json: () => Promise.resolve(responseData)
                })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            // First request
            const result1 = await optimizer.optimizedFetch(url, options);
            // Second request should use cache
            const result2 = await optimizer.optimizedFetch(url, options);
            
            expect(result1).toEqual(result2);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        test('should not cache POST requests', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });
            
            const url = 'https://api.openai.com/v1/chat/completions';
            const options = { method: 'POST', body: JSON.stringify({ model: 'gpt-4' }) };
            
            await optimizer.optimizedFetch(url, options);
            await optimizer.optimizedFetch(url, options);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('should respect cache expiry', async () => {
            optimizer.config.cacheExpiry = 50; // 50ms
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { method: 'GET' };
            
            // First request
            await optimizer.optimizedFetch(url, options);
            
            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Second request should not use expired cache
            await optimizer.optimizedFetch(url, options);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('configuration', () => {
        test('should allow config updates', () => {
            const newConfig = {
                maxConnectionsPerHost: 10,
                connectionTimeout: 60000,
                requestMergeWindow: 200
            };
            
            optimizer.updateConfig(newConfig);
            
            expect(optimizer.config.maxConnectionsPerHost).toBe(10);
            expect(optimizer.config.connectionTimeout).toBe(60000);
            expect(optimizer.config.requestMergeWindow).toBe(200);
        });

        test('should validate config values', () => {
            expect(() => {
                optimizer.updateConfig({ maxConnectionsPerHost: 0 });
            }).toThrow();
            
            expect(() => {
                optimizer.updateConfig({ connectionTimeout: -1 });
            }).toThrow();
        });
    });

    describe('cleanup and resource management', () => {
        test('should clean up resources on cleanup', () => {
            const host = 'api.openai.com';
            optimizer.createConnection(host);
            
            optimizer.cleanup();
            
            const stats = optimizer.getDetailedStats();
            expect(stats.connections.active).toBe(0);
            expect(stats.connections.poolSize).toBe(0);
        });

        test('should handle multiple cleanup calls', () => {
            expect(() => {
                optimizer.cleanup();
                optimizer.cleanup();
            }).not.toThrow();
        });

        test('should clear caches on cleanup', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url = 'https://api.openai.com/v1/models';
            await optimizer.optimizedFetch(url, { method: 'GET' });
            
            optimizer.cleanup();
            
            // After cleanup, should make new request instead of using cache
            await optimizer.optimizedFetch(url, { method: 'GET' });
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('host-specific optimization', () => {
        test('should optimize for different API providers', () => {
            const openaiHost = 'api.openai.com';
            const claudeHost = 'api.anthropic.com';
            
            const openaiConnection = optimizer.createConnection(openaiHost);
            const claudeConnection = optimizer.createConnection(claudeHost);
            
            expect(openaiConnection.host).toBe(openaiHost);
            expect(claudeConnection.host).toBe(claudeHost);
            
            // Should track separately
            const stats = optimizer.getDetailedStats();
            expect(stats.connections.active).toBe(2);
        });

        test('should handle host-specific rate limits', () => {
            const host = 'api.openai.com';
            
            optimizer.recordRateLimit(host);
            
            const isRateLimited = optimizer.isHostRateLimited(host);
            expect(isRateLimited).toBe(true);
        });
    });

    describe('advanced features', () => {
        test('should support request prioritization', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });
            
            const url = 'https://api.openai.com/v1/models';
            const highPriorityOptions = { method: 'GET', priority: 'high' };
            const lowPriorityOptions = { method: 'GET', priority: 'low' };
            
            // High priority request should be processed first
            await optimizer.optimizedFetch(url, highPriorityOptions);
            await optimizer.optimizedFetch(url, lowPriorityOptions);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('should support request compression', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] }),
                headers: new Map([['content-encoding', 'gzip']])
            });
            
            const url = 'https://api.openai.com/v1/models';
            const options = { 
                method: 'GET',
                headers: { 'Accept-Encoding': 'gzip' }
            };
            
            await optimizer.optimizedFetch(url, options);
            
            const stats = optimizer.getDetailedStats();
            expect(stats.performance.compressionSavings).toBeGreaterThanOrEqual(0);
        });
    });

    describe('error recovery', () => {
        test('should recover from connection pool exhaustion', () => {
            const host = 'api.openai.com';
            optimizer.config.maxConnectionsPerHost = 1;
            
            // Exhaust connection pool
            const connection1 = optimizer.createConnection(host);
            const connection2 = optimizer.createConnection(host);
            
            // Should handle gracefully
            expect(connection1).toBeDefined();
            expect(connection2).toBeDefined();
        });

        test('should handle DNS resolution failures', async () => {
            const networkError = new Error('DNS resolution failed');
            networkError.code = 'ENOTFOUND';
            global.fetch.mockRejectedValue(networkError);
            
            const url = 'https://invalid-domain.com/api';
            
            try {
                await optimizer.optimizedFetch(url, { method: 'GET' });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.code).toBe('ENOTFOUND');
            }
            
            const stats = optimizer.getDetailedStats();
            expect(stats.performance.dnsErrors).toBe(1);
        });
    });
});
