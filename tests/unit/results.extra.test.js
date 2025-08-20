import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ui/results extra coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="totalCount"></div>
      <div id="validCount"></div>
      <div id="invalidCount"></div>
      <div id="paidCount"></div>
      <div id="rateLimitedCount"></div>
      <div id="testingCount"></div>
      <div id="retryingCount"></div>

      <div id="allKeys"></div>
      <div id="validKeys"></div>
      <div id="paidKeys"></div>
      <div id="invalidKeys"></div>
      <div id="rateLimitedKeys"></div>
      <div id="paidKeys"></div>

      <button class="tab active" data-tab="all">All</button>
      <button class="tab" data-tab="valid">Valid</button>
      <button class="tab" data-tab="invalid">Invalid</button>
      <button class="tab" data-tab="paid">Paid</button>
      <button class="tab" data-tab="rate-limited">Rate limited</button>
      <button class="tab" data-tab="paid">Paid</button>
      <div id="allTab" class="tab-content active"></div>
      <div id="validTab" class="tab-content"></div>
      <div id="invalidTab" class="tab-content"></div>
      <div id="paidTab" class="tab-content"></div>
      <div id="rateLimitedTab" class="tab-content"></div>
      <div id="paidTab" class="tab-content"></div>
      <button id="startBtn"></button>
    `;
    window.currentLang = 'zh';
    window.updateTimer = null;
  });

  it('empty lists messages for each tab and default', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    // validKeys empty
    window.updateKeyList('validKeys', []);
    expect(document.getElementById('validKeys').textContent).toContain('暂无有效密钥');
    // invalidKeys empty
    window.updateKeyList('invalidKeys', []);
    expect(document.getElementById('invalidKeys').textContent).toContain('暂无无效密钥');
    // rateLimitedKeys empty
    window.updateKeyList('rateLimitedKeys', []);
    expect(document.getElementById('rateLimitedKeys').textContent).toContain('暂无速率限制密钥');
    // paidKeys empty
    window.updateKeyList('paidKeys', []);
    expect(document.getElementById('paidKeys').textContent).toContain('暂无付费密钥');
    // default branch
    const div = document.createElement('div');
    div.id = 'unknownList';
    document.body.appendChild(div);
    window.updateKeyList('unknownList', []);
    expect(document.getElementById('unknownList').textContent).toContain('暂无数据');
  });

  it('renders unknown status as testing class and raw text; retryCount>0 shows retry info', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.currentLang = 'en';
    window.updateKeyList('allKeys', [
      { key: 'k1', status: 'foo', retryCount: 2 },
      { key: 'k2', status: 'paid' }
    ]);
    const item = document.querySelector('#allKeys .key-item');
    expect(item.querySelector('.key-status').className).toContain('status-testing');
    expect(item.querySelector('.key-status').textContent).toBe('foo');
    expect(item.textContent).toContain('Retry: 2');
    const paidItem = document.querySelectorAll('#allKeys .key-item')[1];
    expect(paidItem.querySelector('.key-status').className).toContain('status-paid');
  });

  it('updateStartButtonText toggles by isTestingInProgress', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.isTestingInProgress = false;
    window.updateStartButtonText();
    expect(document.getElementById('startBtn').getAttribute('data-lang-key')).toBe('start-test');
    window.isTestingInProgress = true;
    window.updateStartButtonText();
    expect(document.getElementById('startBtn').getAttribute('data-lang-key')).toBe('cancel-test');
  });

  it('showTab 支持 rate-limited 特殊映射', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.showTab('rate-limited');
    expect(document.querySelector('[data-tab="rate-limited"]').classList.contains('active')).toBe(true);
    expect(document.getElementById('rateLimitedTab').classList.contains('active')).toBe(true);
  });

  it('updateKeyList 覆盖 retrying 分支与无错误信息分支', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    window.currentLang = 'zh';
    // retrying 分支
    window.updateKeyList('allKeys', [ { key: 'kr', status: 'retrying', retryCount: 1 } ]);
    const retryItem = document.querySelector('#allKeys .key-item .key-status');
    expect(retryItem.className).toContain('status-retrying');
    // rate-limited 无错误信息分支
    document.getElementById('rateLimitedKeys').innerHTML = '';
    window.updateKeyList('rateLimitedKeys', [ { key: 'krl', status: 'rate-limited' } ]);
    const rlItem = document.querySelector('#rateLimitedKeys .key-item');
    expect(rlItem).toBeTruthy();
  });

  it('updateUIAsync schedules once and clears timer', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    vi.useFakeTimers();
    window.updateUIAsync();
    window.updateUIAsync();
    expect(vi.getTimerCount()).toBe(1);
    vi.runAllTimers();
    expect(window.updateTimer).toBe(null);
    vi.useRealTimers();
  });

  it('updateStats/updateKeyLists 在缺少 paid DOM 时仍可运行（覆盖 false 分支）', async () => {
    // 重新构造一个不含 paidCount/paidKeys 的最小 DOM
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
    `;
    await import('../../js/i18n/translations.js');
    await import('../../js/i18n/i18n.js');
    await import('../../js/ui/results.js');
    // 包含 paid 状态，确保分支计算被触发
    window.allKeysData = [
      { key: 'k1', status: 'valid' },
      { key: 'k2', status: 'paid' },
      { key: 'k3', status: 'rate-limited' }
    ];
    // 不应抛错，且其它计数应正常
    window.updateStats();
    window.updateKeyLists();
    expect(document.getElementById('totalCount').textContent).toBe('3');
    expect(document.getElementById('validCount').textContent).toBe('1');
    expect(document.getElementById('rateLimitedCount').textContent).toBe('1');
  });
});


