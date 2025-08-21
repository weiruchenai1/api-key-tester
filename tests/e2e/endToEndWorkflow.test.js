import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements for complete UI
document.body.innerHTML = `
    <div id="apiType">
        <option value="openai" selected>OpenAI GPT</option>
        <option value="claude">Claude</option>
        <option value="gemini">Google Gemini</option>
    </div>
    <textarea id="apiKeys"></textarea>
    <div id="resultsContainer"></div>
    <div id="progressBar"></div>
    <div id="progressFill"></div>
    <div id="startBtn"></div>
    <div id="clearBtn"></div>
`;

// Mock all browser APIs
global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

global.fetch = vi.fn();
global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 * 10,
        totalJSHeapSize: 1024 * 1024 * 50
    }
};

global.console = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

describe('End-to-End Workflow Tests', () => {
    let highSpeedController;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Import all modules to simulate real environment
        await import('../../js/core/adaptiveConcurrencyManager.js');
        await import('../../js/core/smartRetryManager.js');
        await import('../../js/core/enhancedMemoryManager.js');
        await import('../../js/core/highPerformanceProcessor.js');
        await import('../../js/core/networkOptimizer.js');
        await import('../../js/core/highSpeedController.js');

        highSpeedController = global.highSpeedController;
        
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

    describe('Complete API Key Testing Workflow', () => {
        test('should complete full OpenAI key validation workflow', async () => {
            const testKeys = [
                'sk-test1234567890abcdef1234567890abcdef12345678',
                'sk-test2345678901bcdef2345678901bcdef23456789',
                'sk-invalid123456789',
                'sk-test3456789012cdef3456789012cdef34567890'
            ];

            // Mock API responses for different scenarios
            global.fetch
                .mockResolvedValueOnce({ // First key - valid
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        data: [
                            { id: 'gpt-4', object: 'model' },
                            { id: 'gpt-3.5-turbo', object: 'model' }
                        ]
                    })
                })
                .mockResolvedValueOnce({ // Second key - valid but limited
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        data: [
                            { id: 'gpt-3.5-turbo', object: 'model' }
                        ]
                    })
                })
                .mockRejectedValueOnce(new Error('Invalid API key')) // Third key - invalid
                .mockResolvedValueOnce({ // Fourth key - valid
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        data: [
                            { id: 'gpt-4', object: 'model' },
                            { id: 'gpt-3.5-turbo', object: 'model' }
                        ]
                    })
                });

            // Mock the detection function
            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key, apiType) => {
                try {
                    const response = await global.fetch(`https://api.openai.com/v1/models`, {
                        headers: { 'Authorization': `Bearer ${key}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const models = data.data.map(m => m.id);
                        return {
                            key,
                            status: 'valid',
                            models,
                            modelCount: models.length,
                            hasGPT4: models.includes('gpt-4'),
                            responseTime: Math.random() * 500 + 100
                        };
                    }
                } catch (error) {
                    return {
                        key,
                        status: 'invalid',
                        error: error.message,
                        responseTime: Math.random() * 200 + 50
                    };
                }
            });

            // Execute the workflow
            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            // Verify results
            expect(results).toHaveLength(4);
            
            const validKeys = results.filter(r => r.status === 'valid');
            const invalidKeys = results.filter(r => r.status === 'invalid');
            
            expect(validKeys).toHaveLength(3);
            expect(invalidKeys).toHaveLength(1);
            
            // Check specific results
            expect(validKeys[0].hasGPT4).toBe(true);
            expect(validKeys[1].hasGPT4).toBe(false);
            expect(invalidKeys[0].key).toBe('sk-invalid123456789');

            // Verify system statistics
            const stats = highSpeedController.getDetailedStats();
            expect(stats.global.totalRequests).toBe(4);
            expect(stats.global.successfulRequests).toBe(3);
            expect(stats.global.successRate).toBe(0.75);
        });

        test('should handle Claude API workflow with different response format', async () => {
            const testKeys = [
                'sk-ant-api03-claude-test-key-1',
                'sk-ant-api03-claude-test-key-2'
            ];

            // Mock Claude API responses
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        id: 'msg_test123',
                        type: 'message',
                        content: [{ type: 'text', text: 'Hello' }]
                    })
                })
                .mockRejectedValueOnce(new Error('Authentication failed'));

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key, apiType) => {
                try {
                    const response = await global.fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': key,
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-sonnet-20240229',
                            max_tokens: 1,
                            messages: [{ role: 'user', content: 'Hi' }]
                        })
                    });

                    if (response.ok) {
                        return {
                            key,
                            status: 'valid',
                            model: 'claude-3-sonnet-20240229',
                            responseTime: Math.random() * 800 + 200
                        };
                    }
                } catch (error) {
                    return {
                        key,
                        status: 'invalid',
                        error: error.message,
                        responseTime: Math.random() * 300 + 100
                    };
                }
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'claude');

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('valid');
            expect(results[1].status).toBe('invalid');
            expect(results[0].model).toBe('claude-3-sonnet-20240229');
        });

        test('should handle Gemini API workflow with quota detection', async () => {
            const testKeys = [
                'AIzaSyTest1234567890abcdef',
                'AIzaSyTest2345678901bcdef'
            ];

            // Mock Gemini API responses
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        models: [
                            { name: 'models/gemini-pro', displayName: 'Gemini Pro' }
                        ]
                    })
                })
                .mockRejectedValueOnce(new Error('Quota exceeded'));

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key, apiType) => {
                try {
                    const response = await global.fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            key,
                            status: 'valid',
                            models: data.models.map(m => m.name),
                            isPaid: false, // Default assumption
                            responseTime: Math.random() * 600 + 150
                        };
                    }
                } catch (error) {
                    const isQuotaError = error.message.includes('Quota');
                    return {
                        key,
                        status: isQuotaError ? 'quota_exceeded' : 'invalid',
                        error: error.message,
                        responseTime: Math.random() * 400 + 100
                    };
                }
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'gemini');

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('valid');
            expect(results[1].status).toBe('quota_exceeded');
        });
    });

    describe('Error Recovery and Resilience', () => {
        test('should recover from network interruptions', async () => {
            const testKeys = Array.from({length: 10}, (_, i) => `sk-network-test-${i}`);

            let requestCount = 0;
            global.fetch.mockImplementation(() => {
                requestCount++;
                
                // Simulate network issues for first few requests
                if (requestCount <= 3) {
                    return Promise.reject(new Error('Network timeout'));
                }
                
                // Then succeed
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                });
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                try {
                    await global.fetch('https://api.openai.com/v1/models');
                    return { key, status: 'valid' };
                } catch (error) {
                    // Retry logic should handle this
                    throw error;
                }
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            // Should eventually succeed for most keys despite initial failures
            const validResults = results.filter(r => r.status === 'valid');
            expect(validResults.length).toBeGreaterThan(5);
        });

        test('should handle rate limiting gracefully', async () => {
            const testKeys = Array.from({length: 20}, (_, i) => `sk-rate-limit-${i}`);

            let requestCount = 0;
            global.fetch.mockImplementation(() => {
                requestCount++;
                
                // Simulate rate limiting every 5th request
                if (requestCount % 5 === 0) {
                    const error = new Error('Rate limit exceeded');
                    error.status = 429;
                    return Promise.reject(error);
                }
                
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                });
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                try {
                    await global.fetch('https://api.openai.com/v1/models');
                    return { key, status: 'valid' };
                } catch (error) {
                    if (error.status === 429) {
                        return { key, status: 'rate_limited', error: error.message };
                    }
                    throw error;
                }
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            const validResults = results.filter(r => r.status === 'valid');
            const rateLimitedResults = results.filter(r => r.status === 'rate_limited');

            expect(validResults.length + rateLimitedResults.length).toBe(20);
            expect(rateLimitedResults.length).toBeGreaterThan(0);
        });

        test('should handle memory pressure during large batches', async () => {
            const testKeys = Array.from({length: 1000}, (_, i) => `sk-memory-${i.toString().padStart(4, '0')}`);

            // Simulate memory pressure
            global.performance.memory.usedJSHeapSize = 80 * 1024 * 1024; // 80MB

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { key, status: 'valid' };
            });

            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            expect(results).toHaveLength(1000);

            // Verify memory management occurred
            const memoryManager = global.enhancedMemoryManager;
            const stats = memoryManager.getDetailedStats();
            expect(stats.performance.cleanupCount).toBeGreaterThan(0);
        });
    });

    describe('Performance Validation', () => {
        test('should maintain acceptable performance under normal load', async () => {
            const testKeys = Array.from({length: 100}, (_, i) => `sk-perf-${i}`);

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
                return { key, status: 'valid' };
            });

            const startTime = performance.now();
            const results = await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');
            const endTime = performance.now();

            const processingTime = endTime - startTime;
            const throughput = testKeys.length / (processingTime / 1000);

            expect(results).toHaveLength(100);
            expect(throughput).toBeGreaterThan(10); // At least 10 keys/second
            expect(processingTime).toBeLessThan(15000); // Complete within 15 seconds
        });

        test('should scale concurrency based on performance', async () => {
            const testKeys = Array.from({length: 50}, (_, i) => `sk-scale-${i}`);

            // Mock fast responses to trigger scaling up
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 10)); // Fast response
                return { key, status: 'valid', responseTime: 10 };
            });

            await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            const concurrencyManager = global.adaptiveConcurrencyManager;
            const stats = concurrencyManager.getDetailedStats();

            // Should have scaled up due to good performance
            expect(stats.concurrency.max).toBeGreaterThan(5);
        });
    });

    describe('User Interface Integration', () => {
        test('should update progress indicators correctly', async () => {
            const testKeys = Array.from({length: 20}, (_, i) => `sk-ui-${i}`);
            const progressUpdates = [];

            // Mock progress callback
            highSpeedController.onStatusUpdate((status) => {
                progressUpdates.push({
                    completed: status.completed,
                    total: status.total,
                    percentage: status.percentage
                });
            });

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return { key, status: 'valid' };
            });

            await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            expect(progressUpdates.length).toBeGreaterThan(0);
            
            const finalUpdate = progressUpdates[progressUpdates.length - 1];
            expect(finalUpdate.completed).toBe(20);
            expect(finalUpdate.total).toBe(20);
            expect(finalUpdate.percentage).toBe(100);
        });

        test('should handle UI updates efficiently during processing', async () => {
            const testKeys = Array.from({length: 200}, (_, i) => `sk-ui-perf-${i}`);

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return { key, status: 'valid' };
            });

            const processor = global.highPerformanceProcessor;
            const initialMetrics = processor.getMetrics();

            await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            const finalMetrics = processor.getMetrics();
            
            // UI updates should have been batched efficiently
            expect(finalMetrics.uiUpdateCount).toBeGreaterThan(initialMetrics.uiUpdateCount);
            expect(finalMetrics.droppedFrames).toBeLessThan(10); // Good UI performance
        });
    });

    describe('Data Persistence and Recovery', () => {
        test('should save and restore processing state', async () => {
            const testKeys = Array.from({length: 10}, (_, i) => `sk-persist-${i}`);

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockImplementation(async (key) => {
                return { key, status: 'valid', model: 'gpt-4' };
            });

            // Process keys
            await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            const memoryManager = global.enhancedMemoryManager;
            
            // Verify data was stored
            const storedKeys = memoryManager.getKeysBatch({}, 20);
            expect(storedKeys.length).toBe(10);
            expect(storedKeys.every(k => k.status === 'valid')).toBe(true);

            // Simulate saving to localStorage
            memoryManager.saveToStorage();
            expect(global.localStorage.setItem).toHaveBeenCalled();
        });

        test('should handle corrupted storage gracefully', async () => {
            // Mock corrupted localStorage data
            global.localStorage.getItem.mockReturnValue('invalid-json-data');

            const memoryManager = global.enhancedMemoryManager;
            
            // Should not crash on corrupted data
            expect(() => {
                memoryManager.loadFromStorage();
            }).not.toThrow();

            // Should still function normally
            memoryManager.addKey({
                key: 'sk-recovery-test',
                status: 'pending',
                startTime: Date.now()
            });

            const keys = memoryManager.getKeysBatch({}, 10);
            expect(keys.length).toBe(1);
        });
    });

    describe('Configuration and Customization', () => {
        test('should respect custom configuration settings', async () => {
            const customConfig = {
                maxConcurrency: 15,
                statsUpdateInterval: 500,
                enableOptimizations: true
            };

            highSpeedController.updateConfig(customConfig);

            expect(highSpeedController.config.maxConcurrency).toBe(15);
            expect(highSpeedController.config.statsUpdateInterval).toBe(500);
            expect(highSpeedController.config.enableOptimizations).toBe(true);

            // Test that configuration affects behavior
            const testKeys = Array.from({length: 30}, (_, i) => `sk-config-${i}`);

            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [] })
            });

            highSpeedController.detectSingleKey = vi.fn().mockResolvedValue({
                status: 'valid'
            });

            await highSpeedController.detectKeysAtHighSpeed(testKeys, 'openai');

            const concurrencyManager = global.adaptiveConcurrencyManager;
            const stats = concurrencyManager.getDetailedStats();
            
            // Should respect the custom max concurrency
            expect(stats.concurrency.max).toBeLessThanOrEqual(15);
        });
    });
});
