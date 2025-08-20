import { describe, it, expect, beforeEach } from 'vitest';

describe('i18n extra - paid detection tip', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="gemini-only hidden" data-lang-key="paid-detection-tip"></div>
    `;
    window.currentLang = 'zh';
  });

  it('paid-detection-tip 文案随语言切换', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');

    // 中文
    window.updateLanguage();
    expect(document.querySelector('[data-lang-key="paid-detection-tip"]').textContent)
      .toBe(window.translations.zh['paid-detection-tip']);

    // 英文
    window.toggleLanguage();
    expect(document.querySelector('[data-lang-key="paid-detection-tip"]').textContent)
      .toBe(window.translations.en['paid-detection-tip']);

    // 样式类不受 i18n 影响
    const el = document.querySelector('[data-lang-key="paid-detection-tip"]');
    expect(el.classList.contains('gemini-only')).toBe(true);
    expect(el.classList.contains('hidden')).toBe(true);
  });
});


