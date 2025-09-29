import { vi } from 'vitest';
/**
 * 日志收集工具测试
 */

import {
  LogCollector,
  initializeLogCollector,
  getLogCollector,
  logApiCall
} from '../../utils/logCollector';

// Mock logStorage
vi.mock('../../utils/logStorage', () => ({
  saveLogEntry: vi.fn(() => Promise.resolve()),
  clearLogEntries: vi.fn(() => Promise.resolve())
}));

// Import mocked members (ESM)
import { saveLogEntry, clearLogEntries } from '../../utils/logStorage';

describe('LogCollector', () => {
  let dispatch;
  let logCollector;

  beforeEach(() => {
    dispatch = vi.fn();
    logCollector = new LogCollector(dispatch);
    logCollector.setEnabled(true);
    
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    saveLogEntry.mockClear();
    clearLogEntries.mockClear();
  });

  describe('Constructor and Basic Setup', () => {
    test('should initialize with dispatch function', () => {
      const collector = new LogCollector(dispatch);
      expect(collector.dispatch).toBe(dispatch);
      expect(collector.enabled).toBe(false);
      expect(collector.logsByKey).toBeInstanceOf(Map);
    });

    test('should enable and disable logging', () => {
      logCollector.setEnabled(true);
      expect(logCollector.enabled).toBe(true);
      
      logCollector.setEnabled(false);
      expect(logCollector.enabled).toBe(false);
      expect(logCollector.logsByKey.size).toBe(0);
    });

    test('should clear cache when disabled', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      expect(logCollector.logsByKey.size).toBe(1);
      
      logCollector.setEnabled(false);
      expect(logCollector.logsByKey.size).toBe(0);
    });

    test('should clear cache manually', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      logCollector.clearCache();
      expect(logCollector.logsByKey.size).toBe(0);
    });
  });

  describe('hydrateLogs', () => {
    test('should hydrate logs from array', () => {
      const logs = [
        { key: 'key1', apiType: 'openai' },
        { key: 'key2', apiType: 'gemini' }
      ];
      
      logCollector.hydrateLogs(logs);
      
      expect(logCollector.logsByKey.get('key1')).toEqual(logs[0]);
      expect(logCollector.logsByKey.get('key2')).toEqual(logs[1]);
    });

    test('should handle invalid input gracefully', () => {
      logCollector.hydrateLogs(null);
      logCollector.hydrateLogs(undefined);
      logCollector.hydrateLogs('not an array');
      logCollector.hydrateLogs([null, undefined, { invalidLog: true }]);
      
      expect(logCollector.logsByKey.size).toBe(0);
    });

    test('should only hydrate logs with valid keys', () => {
      const logs = [
        { key: 'valid-key', apiType: 'openai' },
        { apiType: 'gemini' }, // no key
        null,
        { key: '', apiType: 'claude' } // empty key
      ];
      
      logCollector.hydrateLogs(logs);
      
      expect(logCollector.logsByKey.size).toBe(1);
      expect(logCollector.logsByKey.get('valid-key')).toEqual(logs[0]);
    });
  });

  describe('recordEvent', () => {
    test('should not record when disabled', () => {
      logCollector.setEnabled(false);
      
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      expect(dispatch).not.toHaveBeenCalled();
      expect(logCollector.logsByKey.size).toBe(0);
    });

    test('should not record without key', () => {
      logCollector.recordEvent({
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      expect(dispatch).not.toHaveBeenCalled();
      expect(logCollector.logsByKey.size).toBe(0);
    });

    test('should create new log entry for new key', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        model: 'gpt-4',
        metadata: { userId: 123 },
        event: { stage: 'test_start', status: 'testing' }
      });
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_LOG',
        payload: expect.objectContaining({
          key: 'test-key',
          apiType: 'openai',
          model: 'gpt-4',
          metadata: { userId: 123 },
          status: 'testing'
        })
      });
      
      expect(logCollector.logsByKey.size).toBe(1);
      expect(saveLogEntry).toHaveBeenCalled();
    });

    test('should update existing log entry', () => {
      // Create initial entry
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test_start' }
      });
      
      dispatch.mockClear();
      
      // Update entry
      logCollector.recordEvent({
        key: 'test-key',
        event: { stage: 'test_result', status: 'success', isFinal: true }
      });
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          key: 'test-key',
          status: 'success',
          finalStatus: 'success'
        })
      });
    });

    test('should start new run when stage is test_start for existing key', () => {
      // Create initial entry
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test_result', status: 'error' }
      });
      
      const firstEntry = logCollector.logsByKey.get('test-key');
      dispatch.mockClear();
      
      // Start new run
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test_start', status: 'testing' }
      });
      
      const newEntry = logCollector.logsByKey.get('test-key');
      expect(newEntry.id).toBe(firstEntry.id); // Same ID but new run
      expect(newEntry.events.length).toBe(1); // Reset events
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          status: 'testing'
        })
      });
    });

    test('should merge metadata when updating existing entry', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        metadata: { userId: 123, sessionId: 'abc' },
        event: { stage: 'test_start' }
      });
      
      logCollector.recordEvent({
        key: 'test-key',
        metadata: { requestId: 'xyz' },
        event: { stage: 'test_result' }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      expect(entry.metadata).toEqual({
        userId: 123,
        sessionId: 'abc',
        requestId: 'xyz'
      });
    });

    test('should track attempts and retry count', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'attempt_start', attempt: 1 }
      });
      
      logCollector.recordEvent({
        key: 'test-key',
        event: { stage: 'retry', attempt: 2 }
      });
      
      logCollector.recordEvent({
        key: 'test-key',
        event: { stage: 'attempt_result', attempt: 3 }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      expect(entry.attempts).toBe(3);
      expect(entry.retryCount).toBe(2);
    });

    test('should handle persistence errors gracefully', () => {
      saveLogEntry.mockRejectedValue(new Error('Storage error'));
      
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      // Should still work despite storage error
      expect(dispatch).toHaveBeenCalled();
      expect(logCollector.logsByKey.size).toBe(1);
    });
  });

  describe('logApiStart', () => {
    test('should log API start event', () => {
      const request = { url: 'https://api.openai.com/v1/chat', method: 'POST' };
      
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', request);
      
      expect(logId).toBeTruthy();
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_LOG',
        payload: expect.objectContaining({
          key: 'test-key',
          apiType: 'openai',
          model: 'gpt-4',
          status: 'testing',
          lastRequest: expect.objectContaining({
            url: 'https://api.openai.com/v1/chat',
            method: 'POST'
          })
        })
      });
    });

    test('should return null when disabled', () => {
      logCollector.setEnabled(false);
      
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {});
      
      expect(logId).toBeNull();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('logApiSuccess', () => {
    test('should log API success event', () => {
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {});
      dispatch.mockClear();
      
      const response = { status: 200, body: 'success' };
      logCollector.logApiSuccess(logId, response, 1500);
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          status: 'success',
          finalStatus: 'success',
          duration: 1500,
          lastResponse: expect.objectContaining({
            status: 200,
            body: 'success'
          })
        })
      });
    });

    test('should not log when disabled or invalid logId', () => {
      logCollector.setEnabled(false);
      logCollector.logApiSuccess('invalid-id', {}, 1000);
      
      logCollector.setEnabled(true);
      logCollector.logApiSuccess(null, {}, 1000);
      
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('logApiError', () => {
    test('should log API error event', () => {
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {});
      dispatch.mockClear();
      
      const error = new Error('API timeout');
      logCollector.logApiError(logId, error, 5000, 0);
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          status: 'error',
          finalStatus: 'error',
          duration: 5000,
          lastError: expect.objectContaining({
            message: 'API timeout'
          })
        })
      });
    });

    test('should log retry event for retries', () => {
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {});
      dispatch.mockClear();
      
      const error = new Error('Rate limit');
      logCollector.logApiError(logId, error, 2000, 1);
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          status: 'retrying',
          attempts: 2,
          retryCount: 1
        })
      });
      // And ensure finalStatus is not set for non-final events
      const entry = logCollector.logsByKey.get('test-key');
      expect(entry.finalStatus).toBeUndefined();
    });
  });

  describe('logApiRetry', () => {
    test('should log retry scheduled event', () => {
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {});
      dispatch.mockClear();
      
      logCollector.logApiRetry(logId, 1);
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_LOG',
        payload: expect.objectContaining({
          status: 'retrying',
          attempts: 2,
          retryCount: 1
        })
      });
    });
  });

  describe('addLog', () => {
    test('should add manual log entry', () => {
      const error = { message: 'Invalid API key' };
      
      logCollector.addLog('openai', 'test-key', 'error', error, 'gpt-4');
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_LOG',
        payload: expect.objectContaining({
          key: 'test-key',
          apiType: 'openai',
          model: 'gpt-4',
          status: 'error',
          finalStatus: 'error',
          lastError: error
        })
      });
    });

    test('should mark final status for success and error', () => {
      logCollector.addLog('openai', 'key1', 'success');
      logCollector.addLog('openai', 'key2', 'error');
      logCollector.addLog('openai', 'key3', 'testing');
      
      expect(logCollector.logsByKey.get('key1').finalStatus).toBe('success');
      expect(logCollector.logsByKey.get('key2').finalStatus).toBe('error');
      expect(logCollector.logsByKey.get('key3').finalStatus).toBe('testing');
    });
  });

  describe('clearLogs', () => {
    test('should clear logs and dispatch clear action', async () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: { stage: 'test' }
      });
      
      expect(logCollector.logsByKey.size).toBe(1);
      
      const result = logCollector.clearLogs();
      
      expect(logCollector.logsByKey.size).toBe(0);
      expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_LOGS' });
      expect(clearLogEntries).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Promise);
    });

    test('should handle persistence errors gracefully', () => {
      clearLogEntries.mockRejectedValue(new Error('Clear failed'));
      
      logCollector.clearLogs();
      
      expect(logCollector.logsByKey.size).toBe(0);
      expect(dispatch).toHaveBeenCalled();
    });
  });

  describe('Data Sanitization', () => {
    test('should trim long strings', () => {
      const longString = 'x'.repeat(5000);
      
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: {
          stage: 'test',
          message: longString,
          request: { body: longString }
        }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      const event = entry.events[0];
      
      expect(event.message.length).toBeLessThan(5000);
      expect(event.message).toContain('...(+');
      expect(event.request.body.length).toBeLessThan(5000);
    });

    test('should normalize headers', () => {
      const headersMap = new Map([
        ['authorization', 'Bearer token'],
        ['content-type', 'application/json']
      ]);
      
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: {
          stage: 'test',
          request: { headers: headersMap }
        }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      const headers = entry.events[0].request.headers;
      
      expect(headers).toEqual({
        'authorization': 'Bearer token',
        'content-type': 'application/json'
      });
    });

    test('should handle header normalization errors', () => {
      const badHeaders = {
        forEach: () => {
          throw new Error('Headers error');
        }
      };
      
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        event: {
          stage: 'test',
          request: { headers: badHeaders }
        }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      const headers = entry.events[0].request.headers;
      
      expect(headers.error).toContain('Unable to serialize headers');
    });

    test('should sanitize different error types', () => {
      // String error
      logCollector.recordEvent({
        key: 'key1',
        apiType: 'openai',
        event: { stage: 'test', error: 'String error' }
      });
      
      // Error object
      const errorObj = new Error('Test error');
      logCollector.recordEvent({
        key: 'key2',
        apiType: 'openai',
        event: { stage: 'test', error: errorObj }
      });
      
      // Plain object error
      logCollector.recordEvent({
        key: 'key3',
        apiType: 'openai',
        event: { stage: 'test', error: { code: 500, message: 'Server error' } }
      });
      
      expect(logCollector.logsByKey.get('key1').events[0].error).toEqual({
        message: 'String error'
      });
      
      expect(logCollector.logsByKey.get('key2').events[0].error).toEqual({
        message: 'Test error',
        stack: errorObj.stack
      });
      
      expect(logCollector.logsByKey.get('key3').events[0].error).toEqual({
        code: 500,
        message: 'Server error'
      });
    });
  });

  describe('Global Functions', () => {
    test('should initialize global log collector', () => {
      const globalCollector = initializeLogCollector(dispatch);
      
      expect(globalCollector).toBeInstanceOf(LogCollector);
      expect(getLogCollector()).toBe(globalCollector);
    });

    test('should log API call through global function', () => {
      const globalCollector = initializeLogCollector(dispatch);
      globalCollector.setEnabled(true);
      
      logApiCall('openai', 'test-key', 'success', null, 'gpt-4');
      
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_LOG',
        payload: expect.objectContaining({
          key: 'test-key',
          apiType: 'openai',
          model: 'gpt-4',
          status: 'success'
        })
      });
    });

    test('should handle global log call when collector not initialized', () => {
      // Reset global collector
      const originalCollector = getLogCollector();
      
      // This shouldn't throw
      logApiCall('openai', 'test-key', 'success');
      
      // Restore
      if (originalCollector) {
        initializeLogCollector(originalCollector.dispatch);
      }
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('should handle complete API test lifecycle', () => {
      // Start test
      const logId = logCollector.logApiStart('openai', 'test-key', 'gpt-4', {
        url: 'https://api.openai.com/v1/chat',
        method: 'POST',
        body: '{"model":"gpt-4"}'
      });
      
      // Simulate first attempt failure
      logCollector.logApiError(logId, new Error('Rate limit'), 2000, 1);
      
      // Simulate retry
      logCollector.logApiRetry(logId, 1);
      
      // Simulate second attempt success
      logCollector.logApiSuccess(logId, {
        status: 200,
        body: '{"id":"chatcmpl-123","object":"chat.completion"}'
      }, 1500);
      
      const entry = logCollector.logsByKey.get('test-key');
      
      expect(entry.events.length).toBe(4);
      expect(entry.attempts).toBe(2);
      expect(entry.retryCount).toBe(1);
      expect(entry.finalStatus).toBe('success');
      expect(entry.duration).toBe(1500);
    });

    test('should handle multiple concurrent tests for different keys', () => {
      const keys = ['key1', 'key2', 'key3'];
      const logIds = [];
      
      // Start all tests
      keys.forEach((key, index) => {
        const logId = logCollector.logApiStart('openai', key, 'gpt-4', {});
        logIds.push(logId);
      });
      
      // Complete tests with different outcomes
      logCollector.logApiSuccess(logIds[0], { status: 200 }, 1000);
      logCollector.logApiError(logIds[1], new Error('Invalid key'), 500, 0);
      logCollector.logApiError(logIds[2], new Error('Timeout'), 5000, 0);
      
      expect(logCollector.logsByKey.size).toBe(3);
      expect(logCollector.logsByKey.get('key1').finalStatus).toBe('success');
      expect(logCollector.logsByKey.get('key2').finalStatus).toBe('error');
      expect(logCollector.logsByKey.get('key3').finalStatus).toBe('error');
    });

    test('should handle metadata updates throughout lifecycle', () => {
      logCollector.recordEvent({
        key: 'test-key',
        apiType: 'openai',
        metadata: { sessionId: 'abc', userId: 123 },
        event: { stage: 'test_start' }
      });
      
      logCollector.recordEvent({
        key: 'test-key',
        metadata: { requestId: 'req-1', attempt: 1 },
        event: { stage: 'attempt_start' }
      });
      
      logCollector.recordEvent({
        key: 'test-key',
        metadata: { responseTime: 1500, tokens: 150 },
        event: { stage: 'attempt_result', status: 'success', isFinal: true }
      });
      
      const entry = logCollector.logsByKey.get('test-key');
      expect(entry.metadata).toEqual({
        sessionId: 'abc',
        userId: 123,
        requestId: 'req-1',
        attempt: 1,
        responseTime: 1500,
        tokens: 150
      });
    });
  });
});