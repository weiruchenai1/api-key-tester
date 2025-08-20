import { describe, it, expect, beforeEach } from 'vitest';

describe('i18n', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // 默认中文
    window.currentLang = 'zh';
  });

  it('updateLanguage 与 toggleLanguage：文本与占位符切换', async () => {
    // 准备 DOM
    document.body.innerHTML = `
      <h1 data-lang-key="title"></h1>
      <small data-lang-key="model-help"></small>
      <input id="modelInput" data-lang-key="model-input-placeholder" />
    `;

    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');

    // 中文
    // stub 外部刷新函数应被调用
    window.updateModelOptions = () => {};
    window.updateKeyLists = () => {};
    window.updateLanguage();
    expect(document.querySelector('[data-lang-key="title"]').textContent)
      .toBe(window.translations.zh['title']);
    expect(document.getElementById('modelInput').placeholder)
      .toBe(window.translations.zh['model-input-placeholder']);

    // 英文
    window.toggleLanguage();
    expect(document.querySelector('[data-lang-key="title"]').textContent)
      .toBe(window.translations.en['title']);
    expect(document.getElementById('modelInput').placeholder)
      .toBe(window.translations.en['model-input-placeholder']);
  });

  it('getLocalizedError：速率限制与映射文本', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');

    // 速率限制类
    window.currentLang = 'zh';
    expect(window.getLocalizedError('Rate Limited (429)'))
      .toBe('速率限制 (429)');
    expect(window.getLocalizedError('Rate Limited: quota exceeded'))
      .toBe('速率限制');

    // 直接映射
    expect(window.getLocalizedError('认证失败 (401)'))
      .toBe('认证失败 (401)');
    // API错误/请求失败/测试异常前缀
    expect(window.getLocalizedError('API错误: something'))
      .toBe('API错误: something');
    expect(window.getLocalizedError('请求失败: net'))
      .toBe('请求失败: net');
    expect(window.getLocalizedError('测试异常: boom'))
      .toBe('测试异常: boom');

    // HTTP 直通
    expect(window.getLocalizedError('HTTP 500')).toBe('HTTP 500');

    // 模式 (文本(代码)) - 原实现将所有含 429 的提示归一到“速率限制 (429)”
    expect(window.getLocalizedError('请求过多 (429)')).toBe('速率限制 (429)');

    // 英文分支保持原样
    window.currentLang = 'en';
    expect(window.getLocalizedError('Rate Limited (429)')).toBe('Rate Limited (429)');
    expect(window.getLocalizedError('API错误: detail')).toBe('API Error: detail');
    expect(window.getLocalizedError('Rate Limited: detail')).toBe('Rate Limited: detail');

    // 括号映射中未收录的错误文本应原样保留
    window.currentLang = 'zh';
    expect(window.getLocalizedError('其他错误 (418)')).toBe('其他错误 (418)');

    // 默认未知
    expect(window.getLocalizedError(null)).toBe('未知错误');
    window.currentLang = 'en';
    expect(window.getLocalizedError(null)).toBe('Unknown Error');
  });
});


