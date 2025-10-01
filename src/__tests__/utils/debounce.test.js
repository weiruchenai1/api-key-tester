import { vi } from 'vitest';
/**
 * Debounce工具函数测试
 */

import { debounce } from '../../utils/debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should call function after delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('test');
    
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('should only call function once if called multiple times within delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');
    
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third'); // Last call wins
  });

  test('should call function with latest arguments', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('arg1', 'arg2');
    debouncedFn('arg3', 'arg4');
    
    vi.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('arg3', 'arg4');
  });

  test('should reset delay on each call', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('test1');
    
    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    debouncedFn('test2'); // This should reset the timer
    
    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(50); // Total 100ms from second call
    expect(mockFn).toHaveBeenCalledWith('test2');
  });

  test('should handle immediate execution if delay is 0', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);
    
    debouncedFn('immediate');
    
    vi.runAllTimers();
    
    expect(mockFn).toHaveBeenCalledWith('immediate');
  });

  test('should handle multiple debounced functions independently', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    const debouncedFn1 = debounce(mockFn1, 100);
    const debouncedFn2 = debounce(mockFn2, 200);
    
    debouncedFn1('fn1');
    debouncedFn2('fn2');
    
    vi.advanceTimersByTime(100);
    
    expect(mockFn1).toHaveBeenCalledWith('fn1');
    expect(mockFn2).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100); // Total 200ms
    
    expect(mockFn2).toHaveBeenCalledWith('fn2');
  });

  test('should work with pre-bound functions', () => {
    const obj = {
      value: 'test',
      getValue: function() {
        return this.value;
      }
    };
    
    const spy = vi.fn();
    const debouncedMethod = debounce(function() {
      spy(this.getValue());
    }.bind(obj), 100);
    
    debouncedMethod();
    
    vi.advanceTimersByTime(100);
    
    expect(spy).toHaveBeenCalledWith('test');
  });

  test('should work with pre-bound methods', () => {
    let result = null;
    const obj = {
      value: 'direct-test',
      method: function() {
        result = this.value;
        return this.value;
      }
    };
    
    const debouncedMethod = debounce(obj.method.bind(obj), 100);
    debouncedMethod();
    
    vi.advanceTimersByTime(100);
    
    expect(result).toBe('direct-test');
  });

  test('should handle function that throws error', () => {
    const mockFn = vi.fn(() => {
      throw new Error('Test error');
    });
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('test');
    
    expect(() => {
      vi.advanceTimersByTime(100);
    }).toThrow('Test error');
  });

  test('should handle negative delay by treating it as 0', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, -100);
    
    debouncedFn('negative delay');
    
    vi.runAllTimers();
    
    expect(mockFn).toHaveBeenCalledWith('negative delay');
  });

  test('should work with async functions', () => {
    const mockAsyncFn = vi.fn(async (value) => {
      return Promise.resolve(value);
    });
    const debouncedFn = debounce(mockAsyncFn, 100);
    
    debouncedFn('async test');
    
    vi.advanceTimersByTime(100);
    
    expect(mockAsyncFn).toHaveBeenCalledWith('async test');
  });
});