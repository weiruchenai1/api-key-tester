import { describe, it, expect, beforeEach } from 'vitest';

describe('ui/results', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="totalCount"></div>
      <div id="validCount"></div>
      <div id="invalidCount"></div>
      <div id="rateLimitedCount"></div>
      <div id="testingCount"></div>
      <div id="retryingCount"></div>

      <div id="allKeys"></div>
      <div id="validKeys"></div>
      <div id="invalidKeys"></div>
      <div id="rateLimitedKeys"></div>

      <button class="tab active" data-tab="all">All</button>
      <button class="tab" data-tab="invalid">Invalid</button>
      <div id="allTab" class="tab-content active"></div>
      <div id="invalidTab" class="tab-content"></div>
    `;
    window.currentLang = 'zh';
  });

  it('updateStats 正确统计各状态数量', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.allKeysData = [
      { status: 'valid' },
      { status: 'invalid' },
      { status: 'rate-limited' },
      { status: 'testing' },
      { status: 'pending' },
      { status: 'retrying' }
    ];
    window.updateStats();
    expect(document.getElementById('totalCount').textContent).toBe('6');
    expect(document.getElementById('validCount').textContent).toBe('1');
    expect(document.getElementById('invalidCount').textContent).toBe('1');
    expect(document.getElementById('rateLimitedCount').textContent).toBe('1');
    expect(document.getElementById('testingCount').textContent).toBe('2');
    expect(document.getElementById('retryingCount').textContent).toBe('1');
  });

  it('updateKeyLists 渲染列表与空态', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.allKeysData = [
      { key: 'k1', status: 'valid', model: 'm', retryCount: 0 },
      { key: 'k2', status: 'invalid', error: '认证失败 (401)' },
      { key: 'k3', status: 'rate-limited', error: 'Rate Limited (429)' }
    ];
    window.updateKeyLists();
    expect(document.querySelectorAll('#allKeys .key-item').length).toBe(3);
    expect(document.querySelectorAll('#validKeys .key-item').length).toBe(1);
    expect(document.querySelectorAll('#invalidKeys .key-item').length).toBe(1);
    expect(document.querySelectorAll('#rateLimitedKeys .key-item').length).toBe(1);
    // 空态
    document.getElementById('allKeys').innerHTML = '';
    window.updateKeyList('allKeys', []);
    expect(document.getElementById('allKeys').textContent).toContain('暂无密钥');
  });

  it('showTab 切换 tab 高亮与内容显示', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.showTab('invalid');
    expect(document.querySelector('[data-tab="all"]').classList.contains('active')).toBe(false);
    expect(document.querySelector('[data-tab="invalid"]').classList.contains('active')).toBe(true);
    expect(document.getElementById('allTab').classList.contains('active')).toBe(false);
    expect(document.getElementById('invalidTab').classList.contains('active')).toBe(true);
  });
});


