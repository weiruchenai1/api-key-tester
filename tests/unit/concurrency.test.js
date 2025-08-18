import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Minimal DOM for progress
document.body.innerHTML = `<div id="progressFill" style="width:0%"></div>`;

const originalTimers = { setTimeout };

beforeEach(() => {
  // globals required by module
  global.currentConcurrency = 2;
  global.currentRetryCount = 0;
  global.shouldCancelTesting = false;
  global.completedCount = 0;
  global.totalCount = 0;
  global.allKeysData = [];
  global.updateUIAsync = () => {};
});

afterEach(() => {
  // restore if needed
});

// load module under test (attaches functions to window)
await import('../../js/core/concurrency.js');

describe('concurrency.waitForAnySlotCompletion', () => {
  test('returns index of the earliest resolved slot', async () => {
    const slow = new Promise(res => setTimeout(res, 20));
    const fast = new Promise(res => setTimeout(res, 5));
    const idx = await window.waitForAnySlotCompletion([slow, fast]);
    expect(idx).toBe(1);
  });
});

describe('concurrency.updateProgress', () => {
  test('sets progressFill width based on counts', () => {
    global.completedCount = 3;
    global.totalCount = 6;
    window.updateProgress();
    expect(document.getElementById('progressFill').style.width).toBe('50%');
  });
});

describe('concurrency.startKeyTest', () => {
  test('returns test result and does not throw', async () => {
    global.testApiKeyWithRetry = vi.fn().mockResolvedValue({ valid: true, error: null, isRateLimit: false });
    const r = await window.startKeyTest('k1', 'openai', 0);
    expect(r).toEqual({ valid: true, error: null, isRateLimit: false });
  });

  test('on exception marks key invalid and returns error object', async () => {
    global.allKeysData = [{ key: 'k2', status: 'pending', error: null }];
    global.testApiKeyWithRetry = vi.fn().mockRejectedValue(new Error('boom'));
    const r = await window.startKeyTest('k2', 'openai', 0);
    expect(r).toEqual({ valid: false, error: 'boom', isRateLimit: false });
    expect(global.allKeysData[0].status).toBe('invalid');
    expect(global.allKeysData[0].error).toBe('测试异常: boom');
  });
});

describe('concurrency.processWithFixedConcurrency', () => {
  test('schedules new tasks as slots complete and updates progress', async () => {
    const calls = [];
    // mock test to resolve with different delays depending on key
    global.testApiKeyWithRetry = (key) => new Promise(resolve => {
      const delay = key === 'a' ? 30 : key === 'b' ? 10 : 5;
      setTimeout(() => {
        calls.push(key);
        resolve({ valid: true, error: null, isRateLimit: false });
      }, delay);
    });
    global.completedCount = 0;
    global.totalCount = 3;
    global.currentConcurrency = 2;
    global.shouldCancelTesting = false;

    await window.processWithFixedConcurrency(['a', 'b', 'c'], 'openai');

    expect(global.completedCount).toBe(3);
    // progress should be 100%
    expect(document.getElementById('progressFill').style.width).toBe('100%');
    // all tasks executed
    expect(calls.sort()).toEqual(['a', 'b', 'c']);
  });
});


