import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// DOM 依赖：getSelectedModel / proxyUrl / apiType
document.body.innerHTML = `
  <input id="proxyUrl" />
`;
window.getSelectedModel = () => 'gpt-4o';
await import('../../js/services/apiUrl.js');
await import('../../js/services/openaiService.js');

describe('openaiService', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('getOpenAIModels 200 -> filtered list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'gpt-4o' },
          { id: 'text-embedding-3-large' },
          { id: 'whisper-1' }
        ]
      })
    });
    const models = await window.getOpenAIModels('sk-xxx');
    expect(models).toEqual(['gpt-4o']);
  });

  test('getOpenAIModels 非200返回空数组（401/500）', async () => {
    // 401
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    let models = await window.getOpenAIModels('sk-xxx');
    expect(models).toEqual([]);

    // 500
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    models = await window.getOpenAIModels('sk-xxx');
    expect(models).toEqual([]);
  });

  test('testOpenAIKey 401/403/429/ok', async () => {
    // 401
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    let r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '认证失败 (401)', isRateLimit: false });

    // 403
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '权限不足 (403)', isRateLimit: false });

    // 429
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limited (429)', isRateLimit: true });

    // ok with choices
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ choices: [{}] })
    });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: true, error: null, isRateLimit: false });
  });

  test('testOpenAIKey HTTP 500 fallback', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'HTTP 500', isRateLimit: false });
  });

  test('testOpenAIKey 空响应/JSON解析失败/无choices/错误消息包含rate limit', async () => {
    // 空响应
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => '' });
    let r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '空响应', isRateLimit: false });

    // JSON解析失败
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => 'not-json' });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'JSON解析失败', isRateLimit: false });

    // 无choices且无error → 响应格式错误
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({}) });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: '响应格式错误', isRateLimit: false });

    // data.error.message 包含 rate limit 词，非429
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded' } })
    });
    r = await window.testOpenAIKey('sk-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limited: Rate limit exceeded', isRateLimit: true });
  });
});


