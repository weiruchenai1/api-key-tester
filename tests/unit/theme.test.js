import { describe, it, expect, beforeEach } from 'vitest';

describe('ui/theme', () => {
  beforeEach(() => {
    document.body.className = '';
    document.body.innerHTML = `<button id="themeBtn"></button>`;
    window.isDarkTheme = false;
  });

  it('toggleTheme 切换深浅色（中文）', async () => {
    await import('../../js/ui/theme.js');
    window.currentLang = 'zh';
    const btn = document.getElementById('themeBtn');
    window.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(btn.textContent).toBe('☀️');
    expect(btn.title).toBe('切换到浅色模式');
    window.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    expect(btn.textContent).toBe('🌙');
    expect(btn.title).toBe('切换到深色模式');
  });

  it('toggleTheme 切换深浅色（英文）', async () => {
    await import('../../js/ui/theme.js');
    window.currentLang = 'en';
    const btn = document.getElementById('themeBtn');
    window.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(btn.textContent).toBe('☀️');
    expect(btn.title).toBe('Switch to Light Mode');
    window.toggleTheme();
    expect(document.body.classList.contains('dark-theme')).toBe(false);
    expect(btn.textContent).toBe('🌙');
    expect(btn.title).toBe('Switch to Dark Mode');
  });
});


