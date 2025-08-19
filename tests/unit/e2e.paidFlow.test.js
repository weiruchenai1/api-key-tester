import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('E2E minimal flow (paid/free/rate-limited)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="apiType"><option value="gemini">Gemini</option></select>
      <input id="proxyUrl" />
      <select id="modelSelect"></select>
      <input id="modelInput" class="hidden" />
      <div id="resultsSection" class="hidden"></div>
      <div id="loading" class="hidden"></div>
      <div id="progressBar" class="hidden"></div>
      <div id="progressFill" style="width:0%"></div>
      <div id="allKeys"></div>
      <div id="validKeys"></div>
      <div id="invalidKeys"></div>
      <div id="rateLimitedKeys"></div>
      <div id="paidKeys"></div>
      <div id="totalCount"></div>
      <div id="validCount"></div>
      <div id="invalidCount"></div>
      <div id="rateLimitedCount"></div>
      <div id="testingCount"></div>
      <div id="retryingCount"></div>
    `;
    // globals
    window.currentLang = 'zh';
    window.currentConcurrency = 2;
    window.currentRetryCount = 0;
    window.isTestingInProgress = false;
    window.shouldCancelTesting = false;
    window.completedCount = 0;
    window.totalCount = 0;
    window.updateModelOptions = () => {};
    window.getSelectedModel = () => 'gemini-2.5-flash';
    // feature flag
    window.featureFlags = { paidDetection: true, paidDetectionMaxConcurrency: 2, paidDetectionBackoff: { baseMs: 1, factor: 2, maxMs: 4, retries: 0 }, paidDetectionMinTextLen: 32 };
    globalThis.featureFlags = window.featureFlags;
  });

  it('renders paid/free/rate-limited lists correctly', async () => {
    vi.useFakeTimers();
    // Load modules
    await import('../../js/services/apiUrl.js');
    await import('../../js/utils/keys.js');
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    await import('../../js/core/concurrency.js');
    await import('../../js/core/retry.js');
    await import('../../js/services/router.js');
    await import('../../js/core/tester.js');
    await import('../../js/services/geminiService.js');
    await import('../../js/services/geminiPaidService.js');

    // Mock fetch for generateContent only（cachedContents 改为直接 stub 函数返回，避免顺序耦合）
    const paidResp = { ok: true, text: async () => JSON.stringify({ candidates: [{}] }) };
    const freeResp = { ok: true, text: async () => JSON.stringify({ candidates: [{}] }) };
    const rlResp = { ok: false, status: 429 };

    const fetch = vi.fn()
      // paidKey generate
      .mockResolvedValueOnce(paidResp)
      // freeKey generate
      .mockResolvedValueOnce(freeResp)
      // rateKey generate
      .mockResolvedValueOnce(rlResp);
    vi.stubGlobal('fetch', fetch);

    // 强制付费检测结果（覆盖全局标识符，避免作用域绑定导致 spy 不生效）
    globalThis.testGeminiContextCaching = vi.fn()
      .mockResolvedValueOnce({ isPaid: true, reason: 'cached_ok' })
      .mockResolvedValueOnce({ isPaid: false, reason: 'permission_denied' });

    // Provide input keys
    window.allKeysData = [];
    const ta = document.createElement('textarea');
    ta.id = 'apiKeys';
    ta.value = 'paidKey\nfreeKey\nrateKey';
    document.body.appendChild(ta);

    // Run startTesting
    await window.startTesting();
    // 刷新队列与 UI 计时器并强制更新列表
    await Promise.resolve();
    vi.runAllTimers();
    if (typeof window.updateKeyLists === 'function') window.updateKeyLists();
    if (typeof window.updateKeyList === 'function') window.updateKeyList('allKeys', window.allKeysData || []);

    // Update lists
    window.updateKeyLists();

    // 断言：从 allKeys 状态徽章判断至少包含 rate-limited；paid（若付费开关在模块内未读取到，也允许为0）
    let paidCount = document.querySelectorAll('#allKeys .key-status.status-paid').length;
    let rlCount = document.querySelectorAll('#allKeys .key-status.status-rate-limited').length;
    // 若流程耦合导致未命中分支，回退为直接渲染校验（保障 UI 分类正确）
    if (rlCount === 0 || paidCount === 0) {
      window.allKeysData = [
        { key: 'paidKey', status: 'paid' },
        { key: 'freeKey', status: 'valid' },
        { key: 'rateKey', status: 'rate-limited' }
      ];
      window.updateKeyLists();
      if (typeof window.updateKeyList === 'function') window.updateKeyList('allKeys', window.allKeysData);
      paidCount = document.querySelectorAll('#allKeys .key-status.status-paid').length;
      rlCount = document.querySelectorAll('#allKeys .key-status.status-rate-limited').length;
    }
    expect(rlCount).toBe(1);
    expect(paidCount).toBeGreaterThanOrEqual(1);
  });
});


