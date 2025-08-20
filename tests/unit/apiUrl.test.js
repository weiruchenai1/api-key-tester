import { describe, test, expect } from 'vitest';

// 准备最小 DOM
document.body.innerHTML = `
  <select id="apiType">
    <option value="openai">OpenAI</option>
    <option value="claude">Claude</option>
    <option value="gemini">Gemini</option>
  </select>
  <input id="proxyUrl" />
`;

// 以 ESM 方式加载待测文件，确保被覆盖率工具正确注入
await import('../../js/services/apiUrl.js');

describe('apiUrl', () => {
  test('默认使用公共代理', () => {
    document.getElementById('proxyUrl').value = '';
    expect(window.getApiUrl('openai', '/models')).toBe('https://openai.weiruchenai.me/v1/models');
    expect(window.getApiUrl('claude', '/messages')).toBe('https://claude.weiruchenai.me/v1/messages');
    expect(window.getApiUrl('gemini', '/models')).toBe('https://gemini.weiruchenai.me/v1beta/models');
  });

  test('自定义 proxy（无/有结尾斜杠）', () => {
    document.getElementById('proxyUrl').value = 'https://proxy.example.com/api';
    expect(window.getApiUrl('openai', '/models')).toBe('https://proxy.example.com/api/models');
    document.getElementById('proxyUrl').value = 'https://proxy.example.com/api/';
    expect(window.getApiUrl('gemini', '/x')).toBe('https://proxy.example.com/api/x');
  });

  test('占位符随 API 类型变化', () => {
    const proxy = document.getElementById('proxyUrl');
    // 动态插入一个 gemini-only 元素以验证显隐
    const gemOnly = document.createElement('div');
    gemOnly.className = 'gemini-only hidden';
    document.body.appendChild(gemOnly);
    document.getElementById('apiType').value = 'openai';
    window.updateProxyPlaceholder();
    expect(proxy.placeholder).toBe('https://openai.weiruchenai.me/v1');
    expect(gemOnly.classList.contains('hidden')).toBe(true);
    document.getElementById('apiType').value = 'claude';
    window.updateProxyPlaceholder();
    expect(proxy.placeholder).toBe('https://claude.weiruchenai.me/v1');
    expect(gemOnly.classList.contains('hidden')).toBe(true);
    document.getElementById('apiType').value = 'gemini';
    window.updateProxyPlaceholder();
    expect(proxy.placeholder).toBe('https://gemini.weiruchenai.me/v1beta');
    expect(gemOnly.classList.contains('hidden')).toBe(false);
  });
});


