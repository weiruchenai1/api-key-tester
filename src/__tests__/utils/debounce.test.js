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
    
    vi.advanceTimersByTime(0);
    
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

  test('should preserve this context', () => {
    const obj = {
      value: 'test',
      method: vi.fn(function() {
        return this.value;
      })
    };
    
    // Bind the method to preserve context
    const debouncedMethod = debounce(obj.method.bind(obj), 100);
    debouncedMethod();
    
    vi.advanceTimersByTime(100);
    
    expect(obj.method).toHaveBeenCalled();
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
    
    vi.advanceTimersByTime(0);
    
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