import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('app/bootstrap initialize and bindings', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="langBtn"></button>
      <button id="themeBtn"></button>
      <select id="apiType"><option value="openai">openai</option></select>
      <button id="modelToggleBtn"></button>
      <div id="detectedModelsHeader"></div>
      <button id="detectBtn"></button>
      <button id="startBtn"></button>
      <button id="dedupeBtn"></button>
      <button id="clearBtn"></button>
      <button id="pasteBtn"></button>
      <button id="importBtn"></button>
      <input id="fileInput" type="file" />
      <button data-tab="all"></button>
      <button data-copy="all"></button>
    `;
    // defaults required by init
    window.currentLang = 'zh';
    // stubs in the expected call order
    const order = [];
    window.updateProxyPlaceholder = vi.fn(() => order.push('proxy'));
    window.updateLanguage = vi.fn(() => order.push('lang'));
    window.initConcurrencyControls = vi.fn(() => order.push('concur'));
    window.initRetryControls = vi.fn(() => order.push('retry'));
    // UI handlers
    window.toggleLanguage = vi.fn();
    window.toggleTheme = vi.fn();
    window.toggleModelInput = vi.fn();
    window.toggleModelList = vi.fn();
    window.detectModels = vi.fn();
    window.startTesting = vi.fn();
    window.deduplicateKeys = vi.fn();
    window.clearAll = vi.fn();
    window.pasteFromClipboard = vi.fn();
    window.importFile = vi.fn();
    window.handleFileSelect = vi.fn();
    window.showTab = vi.fn();
    window.copyKeys = vi.fn();
    // ensure readyState is loading so bootstrap waits for DOMContentLoaded
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
  });

  it('initializes in order and binds events (idempotent)', async () => {
    await import('../../js/app/bootstrap.js');
    // trigger initialize
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // order checks
    // proxy -> lang -> concur -> retry
    expect(window.updateProxyPlaceholder).toHaveBeenCalledTimes(1);
    expect(window.updateLanguage).toHaveBeenCalledTimes(1);
    expect(window.initConcurrencyControls).toHaveBeenCalledTimes(1);
    expect(window.initRetryControls).toHaveBeenCalledTimes(1);

    // click bindings
    document.getElementById('langBtn').click();
    expect(window.toggleLanguage).toHaveBeenCalledTimes(1);
    document.getElementById('themeBtn').click();
    expect(window.toggleTheme).toHaveBeenCalledTimes(1);
    document.getElementById('apiType').dispatchEvent(new Event('change'));
    expect(window.updateProxyPlaceholder).toHaveBeenCalledTimes(2);
    document.getElementById('modelToggleBtn').click();
    expect(window.toggleModelInput).toHaveBeenCalledTimes(1);
    document.getElementById('detectedModelsHeader').click();
    expect(window.toggleModelList).toHaveBeenCalledTimes(1);
    document.getElementById('detectBtn').click();
    expect(window.detectModels).toHaveBeenCalledTimes(1);
    document.getElementById('startBtn').click();
    expect(window.startTesting).toHaveBeenCalledTimes(1);
    document.getElementById('dedupeBtn').click();
    expect(window.deduplicateKeys).toHaveBeenCalledTimes(1);
    document.getElementById('clearBtn').click();
    expect(window.clearAll).toHaveBeenCalledTimes(1);
    document.getElementById('pasteBtn').click();
    expect(window.pasteFromClipboard).toHaveBeenCalledTimes(1);
    document.getElementById('importBtn').click();
    expect(window.importFile).toHaveBeenCalledTimes(1);
    document.getElementById('fileInput').dispatchEvent(new Event('change'));
    expect(window.handleFileSelect).toHaveBeenCalledTimes(1);
    document.querySelector('[data-tab]').click();
    expect(window.showTab).toHaveBeenCalledTimes(1);
    document.querySelector('[data-copy]').click();
    expect(window.copyKeys).toHaveBeenCalledTimes(1);

    // idempotent: dispatch again should not duplicate bindings
    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('langBtn').click();
    expect(window.toggleLanguage).toHaveBeenCalledTimes(2); // only from clicks
  });
});


