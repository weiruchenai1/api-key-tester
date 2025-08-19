import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('tester/startTesting re-entry should not cancel in-flight run', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="apiType"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select>
      <div id="loading" class="hidden"></div>
      <div id="progressBar" class="hidden"><div id="progressFill"></div></div>
      <div id="resultsSection" class="hidden"></div>
      <textarea id="apiKeys"></textarea>
      <button id="startBtn"></button>
    `;

    // Globals used by tester & concurrency
    global.allKeysData = [];
    global.currentLang = 'zh';
    global.isTestingInProgress = false;
    global.shouldCancelTesting = false;
    global.completedCount = 0;
    global.totalCount = 0;
    global.currentConcurrency = 2;
    global.currentRetryCount = 0;

    // UI helpers
    global.updateStartButtonText = vi.fn();
    global.updateStats = vi.fn();
    global.updateKeyLists = vi.fn();
    global.alert = vi.fn();

    // Model
    global.getSelectedModel = () => 'gpt-4o';

    // Make UI updates sync for test determinism
    global.updateUIAsync = () => { try { global.updateStats(); } catch {} try { global.updateKeyLists(); } catch {} };

    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('second call to startTesting during active run should be ignored and processing completes', async () => {
    const keys = ['k1','k2','k3','k4','k5'];
    document.getElementById('apiKeys').value = keys.join('\n');
    document.getElementById('apiType').value = 'openai';

    await import('../../js/services/apiUrl.js');
    await import('../../js/core/retry.js');
    await import('../../js/core/concurrency.js');
    await import('../../js/services/router.js');
    await import('../../js/utils/keys.js');
    await import('../../js/core/tester.js');

    // Deferred per key to control resolution
    const deferred = new Map();
    const makeDeferred = (key) => {
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      deferred.set(key, { promise, resolve });
      return deferred.get(key);
    };

    // Mock testApiKey to deferred flow used by retry layer
    global.testApiKey = vi.fn((apiKey) => {
      const d = deferred.get(apiKey) || makeDeferred(apiKey);
      return d.promise.then(() => ({ valid: false, error: '认证失败 (401)', isRateLimit: false }));
    });

    // 预创建所有 deferred，避免覆盖已存在引用
    keys.forEach(k => { if (!deferred.get(k)) makeDeferred(k); });

    const testingPromise = window.startTesting();

    // 等待首批入队（k1,k2）
    await Promise.resolve();
    // 先完成 k1
    deferred.get('k1').resolve();
    await Promise.resolve();

    // 模拟运行中误触第二次开始
    const secondCall = window.startTesting();
    await Promise.resolve(secondCall);

    // 再完成 k2，队列不应被中断，应继续调度后续
    deferred.get('k2').resolve();

    // 后续任务继续
    await Promise.resolve();
    deferred.get('k3').resolve();
    await Promise.resolve();
    deferred.get('k4').resolve();
    await Promise.resolve();
    deferred.get('k5').resolve();

    await testingPromise;

    // 断言：已全部处理完成，进度 100%，无 pending/testing
    expect(global.allKeysData.length).toBe(5);
    expect(document.getElementById('progressFill').style.width).toBe('100%');
    expect(global.allKeysData.some(k => k.status === 'pending' || k.status === 'testing')).toBe(false);
  });
});


