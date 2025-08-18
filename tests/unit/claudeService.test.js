import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

document.body.innerHTML = `<input id="proxyUrl" />`;
window.getSelectedModel = () => 'claude-3-5-haiku-20241022';
await import('../../js/services/apiUrl.js');
await import('../../js/services/claudeService.js');

describe('claudeService', () => {
  const originalFetch = global.fetch;
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { global.fetch = originalFetch; });

  test('testClaudeKey 400 invalid_request_error -> valid true', async () => {
    global.fetch.mockResolvedValueOnce({
      status: 400,
      text: async () => JSON.stringify({ error: { type: 'invalid_request_error' } })
    });
    const r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: true, error: null, isRateLimit: false });
  });

  test('getClaudeModels 过滤可用模型（队列1成功其余失败）', async () => {
    // 根据 commonModels 长度准备 6 次返回：第1次 ok，其余 5 次 500
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' });
    const list = await window.getClaudeModels('sk-xxx');
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  test('testClaudeKey 401/403/429', async () => {
    global.fetch
      .mockResolvedValueOnce({ status: 401, text: async () => '' })
      .mockResolvedValueOnce({ status: 403, text: async () => '' })
      .mockResolvedValueOnce({ status: 429, text: async () => '' });
    let r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '认证失败 (401)', isRateLimit: false });

    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '权限不足 (403)', isRateLimit: false });

    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limited (429)', isRateLimit: true });
  });

  test('testClaudeKey 400 authentication_error / rate_limit_error / JSON解析失败 / ok / HTTP其他', async () => {
    global.fetch
      // authentication_error
      .mockResolvedValueOnce({ status: 400, text: async () => JSON.stringify({ error: { type: 'authentication_error' } }) })
      // rate_limit_error
      .mockResolvedValueOnce({ status: 400, text: async () => JSON.stringify({ error: { type: 'rate_limit_error' } }) })
      // JSON解析失败
      .mockResolvedValueOnce({ status: 400, text: async () => 'not-json' })
      // ok 分支
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' })
      // HTTP 500 fallback
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' });

    let r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '认证错误', isRateLimit: false });
    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limit Error', isRateLimit: true });
    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'JSON解析失败', isRateLimit: false });
    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: true, error: null, isRateLimit: false });
    r = await window.testClaudeKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'HTTP 500', isRateLimit: false });
  });
});


