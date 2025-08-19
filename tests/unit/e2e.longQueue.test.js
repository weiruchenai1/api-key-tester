import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('E2E long queue flow (all keys processed, progress updates)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="apiType"><option value="openai">OpenAI</option></select>
      <input id="proxyUrl" />
      <div id="loading" class="hidden"></div>
      <div id="progressBar" class="hidden"><div id="progressFill"></div></div>
      <div id="resultsSection" class="hidden">
        <div class="stats">
          <div class="stat-card"><div class="stat-number total" id="totalCount">0</div></div>
          <div class="stat-card"><div class="stat-number valid" id="validCount">0</div></div>
          <div class="stat-card"><div class="stat-number invalid" id="invalidCount">0</div></div>
          <div class="stat-card"><div class="stat-number rate-limited" id="rateLimitedCount">0</div></div>
          <div class="stat-card"><div class="stat-number testing" id="testingCount">0</div></div>
          <div class="stat-card"><div class="stat-number retrying" id="retryingCount">0</div></div>
        </div>
        <div class="results-tabs">
          <button class="tab active" data-tab="all"></button>
          <button class="tab" data-tab="valid"></button>
          <button class="tab" data-tab="invalid"></button>
          <button class="tab" data-tab="rate-limited"></button>
        </div>
        <div class="tab-content active" id="allTab"><div class="key-list" id="allKeys"></div></div>
        <div class="tab-content" id="validTab"><div class="key-list" id="validKeys"></div></div>
        <div class="tab-content" id="invalidTab"><div class="key-list" id="invalidKeys"></div></div>
        <div class="tab-content" id="rateLimitedTab"><div class="key-list" id="rateLimitedKeys"></div></div>
      </div>
      <textarea id="apiKeys"></textarea>
      <button id="startBtn"></button>
    `;

    // Globals
    global.allKeysData = [];
    global.currentLang = 'zh';
    global.isTestingInProgress = false;
    global.shouldCancelTesting = false;
    global.completedCount = 0;
    global.totalCount = 0;
    global.updateTimer = null;
    global.currentConcurrency = 3; // smaller to stress queue
    global.currentRetryCount = 0;

    // UI dependencies
    global.updateStartButtonText = vi.fn();
    global.showCompletionMessage = vi.fn();
    global.updateModelOptions = vi.fn();
    global.updateKeyLists = undefined; // will be populated by results.js
    global.alert = vi.fn();

    // Model
    global.getSelectedModel = () => 'gpt-4o';

    // Feature flags (disable paid detection)
    global.featureFlags = { paidDetection: false };

    // 使用真实定时器，避免 runAllTimers 与队列调度的互相影响
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('processes 17 keys to completion, no pending remain, progress hits 100%', async () => {
    const keys = Array.from({ length: 17 }, (_, i) => `k${i+1}`);
    document.getElementById('apiKeys').value = keys.join('\n');
    document.getElementById('apiType').value = 'openai';

    await import('../../js/services/apiUrl.js');
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/core/retry.js');
    await import('../../js/core/concurrency.js');
    await import('../../js/utils/keys.js');
    await import('../../js/ui/results.js');
    // 让 UI 刷新同步执行，避免 50ms 的节流影响 E2E 时序
    window.updateUIAsync = () => { try{ window.updateStats(); }catch{} try{ window.updateKeyLists(); }catch{} };
    await import('../../js/core/tester.js');

    // Mock testApiKey: 使用受控 deferred 队列，确保不会出现未决 Promise
    const deferreds = new Map();
    const makeDeferred = (key) => {
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      deferreds.set(key, { promise, resolve });
      return deferreds.get(key);
    };
    const delayFor = (k) => (k <= 5 ? 1 : (k - 4));
    global.testApiKey = vi.fn((apiKey) => {
      const idx = Number(apiKey.slice(1));
      const d = makeDeferred(apiKey);
      setTimeout(() => d.resolve({ valid: false, error: '认证失败 (401)', isRateLimit: false }), delayFor(idx));
      return d.promise;
    });

    // Start but不要立即 await，先推进假定时器
    const testingPromise = window.startTesting();
    await testingPromise;

    // 强制刷新 UI
    window.updateKeyLists();
    window.updateStats();

    // 断言：全部被处理，且均为 invalid；无 pending/testing
    expect(global.allKeysData.length).toBe(17);
    expect(global.allKeysData.filter(k => k.status === 'invalid').length).toBe(17);
    expect(global.allKeysData.some(k => k.status === 'pending' || k.status === 'testing')).toBe(false);

    // 断言：进度 100%
    expect(document.getElementById('progressFill').style.width).toBe('100%');
  }, 10000);
});


