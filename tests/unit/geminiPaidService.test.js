import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('services/geminiPaidService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '<input id="proxyUrl" value="" />';
    global.fetch = vi.fn();
    global.featureFlags = { paidDetectionMinTextLen: 32 };
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
});


