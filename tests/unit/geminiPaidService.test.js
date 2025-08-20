import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('services/geminiPaidService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '<input id="proxyUrl" value="" />';
    global.fetch = vi.fn();
    global.featureFlags = { paidDetectionMinTextLen: 32, paidDetectionMaxConcurrency: 2, paidDetectionBackoff: { baseMs: 1, factor: 2, maxMs: 4, retries: 1 } };
  });

  it('200 ok -> isPaid true', async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    await import('../../js/services/apiUrl.js');
    const mod = await import('../../js/services/geminiPaidService.js');
    const res = await (window.testGeminiContextCaching || mod.testGeminiContextCaching)('k');
    expect(res).toEqual({ isPaid: true, reason: 'cached_ok' });
  });

  it('403 or PERMISSION_DENIED -> free/no permission', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: { status: 'PERMISSION_DENIED', message: 'permission' } }) });
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const res = await window.testGeminiContextCaching('k');
    expect(res).toEqual({ isPaid: false, reason: 'permission_denied' });
  });

  it('429 or RESOURCE_EXHAUSTED -> rate_limited', async () => {
    // 禁用重试，直接返回 rate_limited
    global.featureFlags.paidDetectionBackoff.retries = 0;
    fetch.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: { status: 'RESOURCE_EXHAUSTED' } }) });
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const res = await window.testGeminiContextCaching('k');
    expect(res).toEqual({ isPaid: false, reason: 'rate_limited' });
  });

  it('5xx -> http_5xx', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const res = await window.testGeminiContextCaching('k');
    expect(res).toEqual({ isPaid: false, reason: 'http_503' });
  });

  it('network error -> network:*', async () => {
    fetch.mockRejectedValueOnce(new Error('fail'));
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const res = await window.testGeminiContextCaching('k');
    expect(res.isPaid).toBe(false);
    expect(res.reason.startsWith('network:')).toBe(true);
  });

  it('429 触发指数退避后返回（有限重试）', async () => {
    // 第一次 429，第二次 200
    fetch
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: { status: 'RESOURCE_EXHAUSTED' } }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const res = await window.testGeminiContextCaching('k');
    expect(res).toEqual({ isPaid: true, reason: 'cached_ok' });
  });

  it('并发上限：超出时排队执行', async () => {
    const makeDeferred = () => {
      let resolve;
      const promise = new Promise((res) => { resolve = res; });
      return { promise, resolve };
    };
    const d1 = makeDeferred();
    const d2 = makeDeferred();
    const d3 = makeDeferred();
    const queue = [d1, d2, d3];
    fetch.mockImplementation(() => queue.shift().promise);
    await import('../../js/services/apiUrl.js');
    await import('../../js/services/geminiPaidService.js');
    const p1 = window.testGeminiContextCaching('k1');
    const p2 = window.testGeminiContextCaching('k2');
    const p3 = window.testGeminiContextCaching('k3'); // 第三个进入队列
    // 释放前两个
    d1.resolve({ ok: true, status: 200, json: async () => ({}) });
    d2.resolve({ ok: true, status: 200, json: async () => ({}) });
    // 让第三个开始并完成
    setTimeout(() => d3.resolve({ ok: true, status: 200, json: async () => ({}) }), 0);
    const all = await Promise.all([p1, p2, p3]);
    all.forEach(r => expect(r).toEqual({ isPaid: true, reason: 'cached_ok' }));
  });
});


