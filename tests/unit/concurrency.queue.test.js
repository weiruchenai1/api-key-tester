import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('core/concurrency queue continues after first batch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = `
      <div id="progressBar" class="hidden"></div>
      <div id="progressFill"></div>
    `;
    // Globals used by concurrency.js
    global.currentConcurrency = 2;
    global.currentRetryCount = 0;
    global.shouldCancelTesting = false;
    global.completedCount = 0;
    global.totalCount = 0; // will set later
    global.updateUIAsync = vi.fn();
  });

  it('processWithFixedConcurrency schedules all tasks, not only the first batch', async () => {
    const keys = ['k1','k2','k3','k4','k5','k6'];
    totalCount = keys.length;

    // Deferred helper
    const deferredMap = new Map();
    const makeDeferred = (key) => {
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      deferredMap.set(key, { promise, resolve });
      return { promise, resolve };
    };

    // Mock testApiKeyWithRetry to return a deferred promise per key
    global.testApiKeyWithRetry = vi.fn((apiKey) => {
      const d = deferredMap.get(apiKey) || makeDeferred(apiKey);
      // Resolve value similar to success result
      return d.promise.then(() => ({ valid: true, error: null, isRateLimit: false }));
    });

    await import('../../js/core/concurrency.js');

    // Kick off processing (do not await yet)
    const processing = window.processWithFixedConcurrency(keys, 'gemini');

    // Release first batch (k1,k2)
    deferredMap.get('k1').resolve();
    deferredMap.get('k2').resolve();

    // Next should start (k3,k4). Release them
    // Wait a tick to allow scheduling
    await Promise.resolve();
    makeDeferred('k3'); makeDeferred('k4');
    deferredMap.get('k3').resolve();
    deferredMap.get('k4').resolve();

    // Next should start (k5,k6). Release them
    await Promise.resolve();
    makeDeferred('k5'); makeDeferred('k6');
    deferredMap.get('k5').resolve();
    deferredMap.get('k6').resolve();

    await processing;

    // Assert all tasks invoked
    expect(global.testApiKeyWithRetry).toHaveBeenCalledTimes(keys.length);
    // Progress should be 100%
    expect(document.getElementById('progressFill').style.width).toBe('100%');
  });

  it('progress bar updates as tasks complete', async () => {
    const keys = ['a','b','c','d'];
    totalCount = keys.length;

    const deferreds = [];
    const makeDeferred = () => {
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      deferreds.push({ promise, resolve });
      return { promise, resolve };
    };

    // For each call, create a new deferred
    global.testApiKeyWithRetry = vi.fn(() => {
      const d = makeDeferred();
      return d.promise.then(() => ({ valid: true, error: null, isRateLimit: false }));
    });

    await import('../../js/core/concurrency.js');

    const processing = window.processWithFixedConcurrency(keys, 'gemini');

    // Wait until first batch of two promises created
    await Promise.resolve();
    expect(deferreds.length).toBe(2);

    // Complete first task
    deferreds[0].resolve();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(document.getElementById('progressFill').style.width).toBe('25%');

    // After a completion, third task should start
    await Promise.resolve();
    expect(deferreds.length).toBeGreaterThanOrEqual(3);

    // Complete second task
    deferreds[1].resolve();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(document.getElementById('progressFill').style.width).toBe('50%');

    // Complete remaining
    deferreds[2].resolve();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(document.getElementById('progressFill').style.width).toBe('75%');

    // Ensure fourth deferred exists then finish
    if (deferreds[3]) deferreds[3].resolve();
    await processing;
    expect(document.getElementById('progressFill').style.width).toBe('100%');
    expect(global.testApiKeyWithRetry).toHaveBeenCalledTimes(4);
  });
});


