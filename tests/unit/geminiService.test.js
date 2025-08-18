import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

document.body.innerHTML = `<input id="proxyUrl" />`;
window.getSelectedModel = () => 'gemini-2.5-flash';
await import('../../js/services/apiUrl.js');
await import('../../js/services/geminiService.js');

describe('geminiService', () => {
  const originalFetch = global.fetch;
  const originalGetSelectedModel = window.getSelectedModel;
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { global.fetch = originalFetch; window.getSelectedModel = originalGetSelectedModel; });

  test('testGeminiKey ok with candidates', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ candidates: [{}] })
    });
    const r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: true, error: null, isRateLimit: false });
  });

  test('testGeminiKey 429 rate limit', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limited (429)', isRateLimit: true });
  });

  test('testGeminiKey 空响应/JSON解析失败/响应格式错误/错误消息包含rate limit词/401/403/400', async () => {
    // 空响应
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => '' });
    let r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '空响应', isRateLimit: false });

    // JSON解析失败
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => 'not-json' });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'JSON解析失败', isRateLimit: false });

    // 响应格式错误（无 candidates 且无 error）
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({}) });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '响应格式错误', isRateLimit: false });

    // 错误消息包含 rate limit（应标记为限流）
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ error: { message: 'quota exceeded' } })
    });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'Rate Limited: quota exceeded', isRateLimit: true });

    // 401/403/400
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '认证失败 (401)', isRateLimit: false });

    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '权限不足 (403)', isRateLimit: false });

    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'API密钥无效 (400)', isRateLimit: false });
  });

  test('getGeminiModels 200与非200', async () => {
    // 200 正常
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }] })
    });
    let models = await window.getGeminiModels('AIzaSy-xxx');
    expect(models).toEqual(['gemini-2.5-flash']);

    // 401 返回空
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    models = await window.getGeminiModels('AIzaSy-xxx');
    expect(models).toEqual([]);
  });

  test('getGeminiModels 500 fallback / 无models结构 / fetch异常', async () => {
    // 500 fallback
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    let models = await window.getGeminiModels('AIzaSy-xxx');
    expect(models).toEqual([]);

    // 无 models 结构
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ not: 'models' }) });
    models = await window.getGeminiModels('AIzaSy-xxx');
    expect(models).toEqual([]);

    // fetch 异常
    global.fetch.mockRejectedValueOnce(new Error('network down'));
    models = await window.getGeminiModels('AIzaSy-xxx');
    expect(models).toEqual([]);
  });

  test('testGeminiKey 未指定模型 / HTTP500 fallback / API错误(非限流) / 异常捕获分支', async () => {
    // 未指定模型
    window.getSelectedModel = () => '';
    let r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '未指定模型', isRateLimit: false });
    window.getSelectedModel = () => 'gemini-2.5-flash';

    // HTTP500 fallback
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'HTTP 500', isRateLimit: false });

    // API错误: 非限流关键词
    global.fetch.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ error: { message: 'bad request' } }) });
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'API错误: bad request', isRateLimit: false });

    // 异常：TypeError(fetch)
    global.fetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '网络连接失败', isRateLimit: false });

    // 异常：SyntaxError(JSON)
    global.fetch.mockRejectedValueOnce(new SyntaxError('JSON broken'));
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: 'JSON解析失败', isRateLimit: false });

    // 异常：其他错误
    global.fetch.mockRejectedValueOnce(new Error('oops'));
    r = await window.testGeminiKey('AIzaSy-xxx');
    expect(r).toEqual({ valid: false, error: '请求失败: oops', isRateLimit: false });
  });
});


