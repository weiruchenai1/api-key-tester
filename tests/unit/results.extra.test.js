import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ui/results extra coverage', () => {
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
      <div id="paidKeys"></div>

      <button class="tab active" data-tab="all">All</button>
      <button class="tab" data-tab="valid">Valid</button>
      <button class="tab" data-tab="invalid">Invalid</button>
      <button class="tab" data-tab="rate-limited">Rate limited</button>
      <button class="tab" data-tab="paid">Paid</button>
      <div id="allTab" class="tab-content active"></div>
      <div id="validTab" class="tab-content"></div>
      <div id="invalidTab" class="tab-content"></div>
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
      { key: 'k1', status: 'foo', retryCount: 2 }
    ]);
    const item = document.querySelector('#allKeys .key-item');
    expect(item.querySelector('.key-status').className).toContain('status-testing');
    expect(item.querySelector('.key-status').textContent).toBe('foo');
    expect(item.textContent).toContain('Retry: 2');
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
});


