/**
 * useWebWorker Hook 测试
 */

import { renderHook, act } from '@testing-library/react';
import { useWebWorker } from '../../hooks/useWebWorker';

// Mock dependencies
const mockDispatch = jest.fn();
const mockLanguage = 'en';

jest.mock('../../contexts/AppStateContext', () => ({
  useAppState: () => ({
    dispatch: mockDispatch
  })
}));

jest.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({ language: mockLanguage })
}));

const mockLogCollector = {
  enabled: true,
  recordEvent: jest.fn()
};

jest.mock('../../utils/logCollector', () => ({
  getLogCollector: jest.fn(() => mockLogCollector)
}));

// Mock Web Worker
class MockWorker {
  constructor(path) {
    this.path = path;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
  }

  postMessage(data) {
    // Simulate worker responses
    setTimeout(() => {
      if (data.type === 'PING' && this.onmessage) {
        this.onmessage({ data: { type: 'PONG' } });
      }
    }, 10);
  }

  terminate() {
    // Mock terminate
  }
}

global.Worker = MockWorker;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/'
  },
  writable: true
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('useWebWorker Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useWebWorker());

    expect(result.current.isWorkerReady).toBe(false);
    expect(typeof result.current.startWorkerTesting).toBe('function');
    expect(typeof result.current.cancelWorkerTesting).toBe('function');
  });

  test('should create worker in development environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderHook(() => useWebWorker());

    expect(global.Worker).toHaveBeenCalledWith('/worker.js');
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should create worker in production environment with PUBLIC_URL', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalPublicUrl = process.env.PUBLIC_URL;
    
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_URL = '/my-app';

    renderHook(() => useWebWorker());

    expect(global.Worker).toHaveBeenCalledWith('/my-app/worker.js');
    
    process.env.NODE_ENV = originalEnv;
    process.env.PUBLIC_URL = originalPublicUrl;
  });

  test('should create worker in production environment without PUBLIC_URL', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalPublicUrl = process.env.PUBLIC_URL;
    
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_URL = '';

    renderHook(() => useWebWorker());

    expect(global.Worker).toHaveBeenCalledWith('./worker.js');
    
    process.env.NODE_ENV = originalEnv;
    process.env.PUBLIC_URL = originalPublicUrl;
  });

  test('should set worker ready when receiving PONG message', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.isWorkerReady).toBe(true);
    expect(console.log).toHaveBeenCalledWith('Worker connected successfully');
  });

  test('should handle KEY_STATUS_UPDATE message', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Simulate KEY_STATUS_UPDATE message
    const mockWorker = global.Worker.mock.instances[0];
    const payload = { key: 'sk-test123', status: 'valid' };

    act(() => {
      mockWorker.onmessage({ data: { type: 'KEY_STATUS_UPDATE', payload } });
    });

    expect(mockDispatch).toHaveBeenCalledWith({ 
      type: 'UPDATE_KEY_STATUS', 
      payload 
    });
  });

  test('should handle LOG_EVENT message', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    const payload = { key: 'sk-test123', event: 'test_start' };

    act(() => {
      mockWorker.onmessage({ data: { type: 'LOG_EVENT', payload } });
    });

    expect(mockLogCollector.recordEvent).toHaveBeenCalledWith(payload);
  });

  test('should handle LOG_EVENT when collector is disabled', async () => {
    mockLogCollector.enabled = false;
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    const payload = { key: 'sk-test123', event: 'test_start' };

    act(() => {
      mockWorker.onmessage({ data: { type: 'LOG_EVENT', payload } });
    });

    expect(mockLogCollector.recordEvent).not.toHaveBeenCalled();
  });

  test('should handle TESTING_COMPLETE message', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];

    act(() => {
      mockWorker.onmessage({ data: { type: 'TESTING_COMPLETE' } });
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'TESTING_COMPLETE' });
  });

  test('should handle unknown message type', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];

    act(() => {
      mockWorker.onmessage({ data: { type: 'UNKNOWN_TYPE' } });
    });

    expect(console.warn).toHaveBeenCalledWith('Unknown worker message type:', 'UNKNOWN_TYPE');
  });

  test('should handle worker creation errors', () => {
    global.Worker = jest.fn(() => {
      throw new Error('Worker creation failed');
    });

    const { result } = renderHook(() => useWebWorker());

    expect(result.current.isWorkerReady).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Failed to create worker:', expect.any(Error));
  });

  test('should handle worker error events', async () => {
    const { result } = renderHook(() => useWebWorker());

    const mockWorker = global.Worker.mock.instances[0];
    const error = new Error('Worker error');

    act(() => {
      mockWorker.onerror(error);
    });

    expect(result.current.isWorkerReady).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Worker error:', error);
  });

  test('should handle worker message errors', async () => {
    const { result } = renderHook(() => useWebWorker());

    const mockWorker = global.Worker.mock.instances[0];
    const error = new Error('Message error');

    act(() => {
      mockWorker.onmessageerror(error);
    });

    expect(result.current.isWorkerReady).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Worker message error:', error);
  });

  test('should send language settings to worker', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    mockWorker.postMessage = jest.fn();

    // Worker should be ready now, test language update
    act(() => {
      // Simulate language change by re-rendering
      result.rerender();
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      type: 'SET_LANGUAGE',
      payload: { language: mockLanguage }
    });
  });

  test('should start worker testing successfully', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const config = { keys: ['sk-test123'], services: ['openai'] };
    const mockWorker = global.Worker.mock.instances[0];
    
    // Mock postMessage to simulate TESTING_COMPLETE
    mockWorker.postMessage = jest.fn((data) => {
      if (data.type === 'START_TESTING') {
        setTimeout(() => {
          mockWorker.onmessage({ data: { type: 'TESTING_COMPLETE' } });
        }, 10);
      }
    });

    await act(async () => {
      await result.current.startWorkerTesting(config);
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      type: 'START_TESTING',
      payload: config
    });
  });

  test('should reject when worker not ready for testing', async () => {
    const { result } = renderHook(() => useWebWorker());

    // Don't wait for worker to be ready
    await expect(result.current.startWorkerTesting({})).rejects.toThrow('Worker not ready');
  });

  test('should handle testing timeout', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    mockWorker.postMessage = jest.fn(); // Don't send TESTING_COMPLETE

    // Mock shorter timeout for testing
    jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      if (delay === 300000) { // 5 minutes
        return global.setTimeout(fn, 10); // Make it 10ms for test
      }
      return global.setTimeout(fn, delay);
    });

    await act(async () => {
      await expect(result.current.startWorkerTesting({})).rejects.toThrow('Worker testing timeout');
    });

    jest.restoreAllMocks();
  });

  test('should cancel worker testing', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    mockWorker.postMessage = jest.fn();

    act(() => {
      result.current.cancelWorkerTesting();
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'CANCEL_TESTING' });
  });

  test('should not cancel testing when worker not ready', () => {
    const { result } = renderHook(() => useWebWorker());

    // Don't wait for worker to be ready
    act(() => {
      result.current.cancelWorkerTesting();
    });

    // Should not throw error
    expect(result.current.isWorkerReady).toBe(false);
  });

  test('should terminate worker on cleanup', () => {
    const { unmount } = renderHook(() => useWebWorker());

    const mockWorker = global.Worker.mock.instances[0];
    mockWorker.terminate = jest.fn();

    unmount();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  test('should handle log collection errors gracefully', async () => {
    mockLogCollector.recordEvent = jest.fn(() => {
      throw new Error('Log error');
    });

    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];
    const payload = { key: 'sk-test123', event: 'test_start' };

    act(() => {
      mockWorker.onmessage({ data: { type: 'LOG_EVENT', payload } });
    });

    expect(console.warn).toHaveBeenCalledWith('记录日志事件失败:', expect.any(Error));
  });

  test('should handle empty or malformed worker messages', async () => {
    const { result } = renderHook(() => useWebWorker());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockWorker = global.Worker.mock.instances[0];

    // Test empty message
    act(() => {
      mockWorker.onmessage({});
    });

    // Test message without data
    act(() => {
      mockWorker.onmessage({ data: null });
    });

    // Test message with empty data
    act(() => {
      mockWorker.onmessage({ data: {} });
    });

    // Should not throw errors
    expect(result.current.isWorkerReady).toBe(true);
  });
});