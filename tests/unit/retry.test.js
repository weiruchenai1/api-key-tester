import { describe, test, expect, beforeEach } from 'vitest';

// 全局依赖模拟
beforeEach(() => {
  // 重置全局状态
  global.allKeysData = [{ key: 'k1', status: 'pending', retryCount: 0 }];
  global.updateUIAsync = () => {};
  // finalizeResult 仅回传 result，并记录最后一次 retryCount
  global.finalizeResult = (keyData, result, retryCount) => {
    if (keyData) keyData.retryCount = retryCount;
    return result;
  };
});

// 加载被测文件（挂到 window 上）
await import('../../js/core/retry.js');

describe('retry.extractStatusCode / shouldRetry', () => {
  test('extractStatusCode 支持(429)与HTTP 500', () => {
    expect(window.extractStatusCode('错误 (429)')).toBe(429);
    expect(window.extractStatusCode('HTTP 500')).toBe(500);
    expect(window.extractStatusCode('unknown')).toBe(null);
  });

  test('shouldRetry 命中状态码与关键词', () => {
    expect(window.shouldRetry('anything', 403)).toBe(true);
    expect(window.shouldRetry('timeout occurred', null)).toBe(true);
    expect(window.shouldRetry('network error', null)).toBe(true);
    expect(window.shouldRetry('连接失败', null)).toBe(true);
    expect(window.shouldRetry('fetch failed', null)).toBe(true);
    expect(window.shouldRetry('other', 400)).toBe(false);
  });
});

describe('retry.testApiKeyWithRetry', () => {
  test('首尝即成功，不重试', async () => {
    let calls = 0;
    global.testApiKey = async () => {
      calls += 1;
      return { valid: true, error: null, isRateLimit: false };
    };
    const result = await window.testApiKeyWithRetry('k1', 'openai', 3);
    expect(result).toEqual({ valid: true, error: null, isRateLimit: false });
    expect(calls).toBe(1);
  });

  test('第一次502触发重试，第二次成功', async () => {
    let calls = 0;
    global.testApiKey = async () => {
      calls += 1;
      if (calls === 1) {
        return { valid: false, error: 'HTTP 502', isRateLimit: false };
      }
      return { valid: true, error: null, isRateLimit: false };
    };
    const result = await window.testApiKeyWithRetry('k1', 'openai', 2);
    expect(result).toEqual({ valid: true, error: null, isRateLimit: false });
    // 重试至少调用2次
    expect(calls).toBe(2);
    expect(global.allKeysData[0].retryCount).toBe(1);
  });

  test('速率限制直接返回，不继续重试', async () => {
    let calls = 0;
    global.testApiKey = async () => {
      calls += 1;
      return { valid: false, error: 'Rate Limited (429)', isRateLimit: true };
    };
    const result = await window.testApiKeyWithRetry('k1', 'openai', 3);
    expect(result).toEqual({ valid: false, error: 'Rate Limited (429)', isRateLimit: true });
    expect(calls).toBe(1);
  });

  test('抛异常时在最大重试后返回测试异常', async () => {
    let calls = 0;
    global.testApiKey = async () => {
      calls += 1;
      throw new Error('boom');
    };
    const result = await window.testApiKeyWithRetry('k1', 'openai', 0);
    expect(result.valid).toBe(false);
    expect(result.error?.startsWith('测试异常:')).toBe(true);
    expect(global.allKeysData[0].retryCount).toBe(0);
  });
});


