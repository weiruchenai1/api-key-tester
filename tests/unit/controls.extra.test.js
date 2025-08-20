import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ui/controls extra coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="concurrencyInput" value="5" />
      <input id="concurrencySlider" type="range" />
      <span id="sliderValue"></span>
      <button class="preset-btn" data-concurrency="5"></button>
      <button class="preset-btn" data-concurrency="8"></button>

      <input id="retryInput" value="3" />
      <input id="retrySlider" type="range" />
      <span id="retrySliderValue"></span>
      <button class="retry-preset-btn" data-retry="3"></button>
      <button class="retry-preset-btn" data-retry="6"></button>

      <textarea id="apiKeys"></textarea>
      <input id="modelInput" />
      <div id="resultsSection" class="hidden"></div>
      <div id="loading" class="hidden"></div>
      <div id="progressBar" class="hidden"></div>
      <div id="progressFill" style="width:0%"></div>
      <div id="detectedModels" style="display:block"></div>
    `;
    window.currentConcurrency = 5;
    window.currentRetryCount = 3;
    window.currentLang = 'zh';
    window.alert = vi.fn();
    window.isTestingInProgress = false;
    window.deduplicateAndCleanKeys = (arr) => {
      const seen = new Set();
      const unique = [];
      const dupCounts = {};
      for (const item of arr) {
        if (!seen.has(item)) {
          seen.add(item);
          unique.push(item);
        } else {
          dupCounts[item] = (dupCounts[item] || 0) + 1;
        }
      }
      const duplicates = [];
      for (const k in dupCounts) {
        for (let i = 0; i < dupCounts[k]; i++) duplicates.push(k);
      }
      return { uniqueKeys: unique, duplicates };
    };
  });

  it('idempotent binding is respected', async () => {
    await import('../../js/ui/controls.js');
    const { initConcurrencyControls, initRetryControls } = window;
    initConcurrencyControls();
    initRetryControls();
    // 第二次调用不应重复绑定（通过 dataset.bound 生效）
    initConcurrencyControls();
    initRetryControls();
    // 改变值验证仍能工作
    document.getElementById('concurrencyInput').value = '8';
    document.getElementById('concurrencyInput').dispatchEvent(new Event('input'));
    expect(document.getElementById('sliderValue').textContent).toBe('8');
  });

  it('deduplicateKeys 行为：有重复/无重复', async () => {
    await import('../../js/ui/controls.js');
    window.currentLang = 'en';
    document.getElementById('apiKeys').value = 'a\na\nb';
    window.deduplicateKeys();
    expect(document.getElementById('apiKeys').value.split('\n')).toEqual(['a','b']);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Removed'));

    window.alert.mockClear();
    document.getElementById('apiKeys').value = 'a\nb';
    window.deduplicateKeys();
    expect(window.alert).toHaveBeenCalledWith('No duplicate keys found.');
  });

  it('clearAll 行为与进行中拦截', async () => {
    await import('../../js/ui/controls.js');
    // 进行中：拦截
    window.isTestingInProgress = true;
    window.clearAll();
    expect(window.alert).toHaveBeenCalled();

    // 非进行中：清理字段
    window.alert.mockClear();
    window.isTestingInProgress = false;
    document.getElementById('apiKeys').value = 'x';
    document.getElementById('modelInput').value = 'm';
    window.allKeysData = [{ key:'k', status:'valid'}];
    window.detectedModels = new Set(['m1']);
    window.completedCount = 1;
    window.totalCount = 1;
    window.updateStats = vi.fn();
    window.updateKeyLists = vi.fn();
    window.showTab = vi.fn();
    window.clearAll();
    expect(document.getElementById('apiKeys').value).toBe('');
    expect(document.getElementById('modelInput').value).toBe('');
    expect(document.getElementById('resultsSection').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('progressBar').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('progressFill').style.width).toBe('0%');
    expect(window.updateStats).toHaveBeenCalled();
    expect(window.updateKeyLists).toHaveBeenCalled();
    expect(window.showTab).toHaveBeenCalledWith('all');
  });
});


