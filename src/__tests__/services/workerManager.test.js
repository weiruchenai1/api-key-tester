import { vi } from 'vitest';
/**
 * WorkerManager测试
 */

import WorkerManager from '../../services/worker/workerManager.js';

// Preserve original Worker to prevent test pollution
const OriginalWorker = global.Worker;

// Mock Worker
class MockWorker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
    
    // Simulate async worker initialization
    setTimeout(() => {
      if (this.onmessage) {
        // Respond to PING message for initialization test
        this.onmessage({
          data: { type: 'PONG', messageId: 1 }
        });
      }
    }, 10);
  }
}

describe('WorkerManager', () => {
  beforeEach(() => {
    global.Worker = MockWorker; // override for each test
    // Reset WorkerManager state
    WorkerManager.worker = null;
    WorkerManager.isReady = false;
    WorkerManager.messageHandlers.clear();
    WorkerManager.nextMessageId = 1;
    WorkerManager.pendingTimeouts.clear();
    WorkerManager.eventHandlers = {};
    
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    WorkerManager.terminate();
    vi.useRealTimers();
  });

  afterAll(() => {
    global.Worker = OriginalWorker; // restore
  });

  describe('init', () => {
    test('should initialize worker successfully', async () => {
      const initPromise = WorkerManager.init();
      
      // Fast-forward to trigger the timeout in MockWorker constructor
      vi.advanceTimersByTime(10);
      
      const result = await initPromise;
      
      expect(result).toBe(true);
      expect(WorkerManager.isReady).toBe(true);
      expect(WorkerManager.worker).toBeInstanceOf(MockWorker);
      expect(WorkerManager.worker.url).toBe('/worker.js');
    });

    test('should return early if worker already exists and is ready', async () => {
      // Initialize first time
      const initPromise1 = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise1;
      
      // Try to initialize again
      const result = await WorkerManager.init();
      
      expect(result).toBe(true);
    });

    test('should handle worker creation error', async () => {
      global.Worker = vi.fn(() => {
        throw new Error('Worker creation failed');
      });
      
      await expect(WorkerManager.init()).rejects.toThrow('Worker creation failed');
    });

    test('should handle worker error event', async () => {
      global.Worker = vi.fn((url) => {
        const worker = new MockWorker(url);
        setTimeout(() => {
          if (worker.onerror) {
            worker.onerror(new Error('Worker runtime error'));
          }
        }, 5);
        return worker;
      });
      
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(5);
      
      await expect(initPromise).rejects.toThrow('Worker runtime error');
      expect(WorkerManager.isReady).toBe(false);
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
    });

    test('should send message and receive response', async () => {
      const mockResponse = { type: 'TEST_RESPONSE', payload: 'success' };
      
      // Mock the worker response
      setTimeout(() => {
        WorkerManager.handleMessage({
          type: 'TEST_RESPONSE',
          payload: 'success',
          messageId: 2
        });
      }, 10);
      
      const promise = WorkerManager.sendMessage('TEST', { data: 'test' });
      vi.advanceTimersByTime(10);
      
      const response = await promise;
      expect(response.payload).toBe('success');
      
      expect(WorkerManager.worker.postMessage).toHaveBeenCalledWith({
        type: 'TEST',
        payload: { data: 'test' },
        messageId: 2
      });
    });

    test('should reject if worker not initialized', async () => {
      WorkerManager.worker = null;
      
      await expect(WorkerManager.sendMessage('TEST')).rejects.toThrow('Worker not initialized');
    });

    test('should handle message timeout', async () => {
      const promise = WorkerManager.sendMessage('TEST');
      
      // Fast-forward past the 30 second timeout
      vi.advanceTimersByTime(30001);
      
      await expect(promise).rejects.toThrow('Message timeout');
    });

    test('should handle error response', async () => {
      setTimeout(() => {
        WorkerManager.handleMessage({
          type: 'ERROR',
          error: 'Something went wrong',
          messageId: 2
        });
      }, 10);
      
      const promise = WorkerManager.sendMessage('TEST');
      vi.advanceTimersByTime(10);
      
      await expect(promise).rejects.toThrow('Something went wrong');
    });

    test('should clean up timeout on successful response', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      setTimeout(() => {
        WorkerManager.handleMessage({
          type: 'SUCCESS',
          messageId: 2
        });
      }, 10);
      
      const promise = WorkerManager.sendMessage('TEST');
      vi.advanceTimersByTime(10);
      await promise;
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(WorkerManager.pendingTimeouts.size).toBe(0);
    });
  });

  describe('postMessage', () => {
    beforeEach(async () => {
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
    });

    test('should post message without expecting response', () => {
      WorkerManager.postMessage('BROADCAST', { data: 'test' });
      
      expect(WorkerManager.worker.postMessage).toHaveBeenCalledWith({
        type: 'BROADCAST',
        payload: { data: 'test' }
      });
    });

    test('should throw if worker not initialized', () => {
      WorkerManager.worker = null;
      
      expect(() => WorkerManager.postMessage('TEST')).toThrow('Worker not initialized');
    });
  });

  describe('event handling', () => {
    test('should register and call event handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      WorkerManager.on('TEST_EVENT', handler1);
      WorkerManager.on('TEST_EVENT', handler2);
      
      WorkerManager.emit('TEST_EVENT', { data: 'test' });
      
      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should remove event handlers', () => {
      const handler = vi.fn();
      
      WorkerManager.on('TEST_EVENT', handler);
      WorkerManager.emit('TEST_EVENT', 'test');
      expect(handler).toHaveBeenCalledTimes(1);
      
      WorkerManager.off('TEST_EVENT', handler);
      WorkerManager.emit('TEST_EVENT', 'test');
      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should handle errors in event handlers gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      WorkerManager.on('TEST_EVENT', errorHandler);
      WorkerManager.on('TEST_EVENT', normalHandler);
      
      WorkerManager.emit('TEST_EVENT', 'test');
      
      expect(consoleSpy).toHaveBeenCalledWith('Event handler error:', expect.any(Error));
      expect(normalHandler).toHaveBeenCalled(); // Should still be called
      
      consoleSpy.mockRestore();
    });

    test('should handle emit when no handlers exist', () => {
      expect(() => {
        WorkerManager.emit('NONEXISTENT_EVENT', 'test');
      }).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    beforeEach(async () => {
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
    });

    test('should handle message with messageId', () => {
      const handler = vi.fn();
      WorkerManager.messageHandlers.set(123, handler);
      
      WorkerManager.handleMessage({
        type: 'RESPONSE',
        payload: 'data',
        messageId: 123
      });
      
      expect(handler).toHaveBeenCalledWith({
        type: 'RESPONSE',
        payload: 'data',
        messageId: 123
      });
      expect(WorkerManager.messageHandlers.has(123)).toBe(false);
    });

    test('should emit broadcast messages', () => {
      const handler = vi.fn();
      WorkerManager.on('BROADCAST', handler);
      
      WorkerManager.handleMessage({
        type: 'BROADCAST',
        payload: 'data'
      });
      
      expect(handler).toHaveBeenCalledWith('data');
    });
  });

  describe('terminate', () => {
    beforeEach(async () => {
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
    });

    test('should clean up all resources', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      // Add some pending operations
      WorkerManager.sendMessage('TEST').catch(() => {}); // Ignore rejection
      WorkerManager.on('TEST', () => {});
      
      expect(WorkerManager.pendingTimeouts.size).toBeGreaterThan(0);
      expect(WorkerManager.messageHandlers.size).toBeGreaterThan(0);
      
      WorkerManager.terminate();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(WorkerManager.pendingTimeouts.size).toBe(0);
      expect(WorkerManager.messageHandlers.size).toBe(0);
      expect(WorkerManager.worker).toBeNull();
      expect(WorkerManager.isReady).toBe(false);
      expect(WorkerManager.eventHandlers).toEqual({});
    });

    test('should handle terminate when worker is null', () => {
      WorkerManager.worker = null;
      
      expect(() => WorkerManager.terminate()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    test('should handle multiple concurrent messages', async () => {
      const initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
      
      // Send multiple messages concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const promise = WorkerManager.sendMessage('TEST', { id: i });
        promises.push(promise);
        
        // Simulate responses
        setTimeout(() => {
          WorkerManager.handleMessage({
            type: 'RESPONSE',
            payload: { id: i, result: 'success' },
            messageId: i + 2 // messageIds start from 2 after PING
          });
        }, 10 + i);
      }
      
      vi.advanceTimersByTime(20);
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.payload.id).toBe(index);
      });
    });

    test.skip('should handle worker restart scenario', async () => {
      // Initialize first worker
      let initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
      
      expect(WorkerManager.isReady).toBe(true);
      
      // Terminate worker
      WorkerManager.terminate();
      expect(WorkerManager.isReady).toBe(false);
      
      // Initialize new worker  
      initPromise = WorkerManager.init();
      vi.advanceTimersByTime(10);
      await initPromise;
      
      expect(WorkerManager.isReady).toBe(true);
      expect(WorkerManager.worker).toBeInstanceOf(MockWorker);
    }, 10000); // Increase timeout to 10s
  });
});