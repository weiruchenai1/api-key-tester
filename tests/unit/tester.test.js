import { describe, test, expect, beforeEach, vi } from 'vitest';

// Minimal DOM required by tester.js
beforeEach(() => {
  document.body.innerHTML = `
    <select id="apiType"><option value="openai">OpenAI</option></select>
    <textarea id="apiKeys"></textarea>
    <div id="loading" class="hidden"></div>
    <div id="progressBar" class="hidden"></div>
    <div id="resultsSection" class="hidden"></div>
  `;
  // globals used by tester
  global.currentLang = 'zh';
  global.isTestingInProgress = false;
  global.shouldCancelTesting = false;
  global.completedCount = 0;
  global.totalCount = 0;
  global.allKeysData = [];
  // stubs
  global.getSelectedModel = () => 'gpt-4o';
  global.updateStartButtonText = () => {};
  global.updateStats = () => {};
  global.updateKeyLists = () => {};
});

// Load module (attaches window.startTesting / finalizeResult)
await import('../../js/core/tester.js');

describe('core/tester.finalizeResult', () => {
  test('sets status by result flags and preserves error/retryCount', () => {
    const kd = { status: 'pending', retryCount: 0, error: null };
    let r = window.finalizeResult(kd, { valid: true, error: null, isRateLimit: false }, 2);
    expect(kd.status).toBe('valid');
    expect(kd.retryCount).toBe(2);
    expect(r.valid).toBe(true);

    r = window.finalizeResult(kd, { valid: false, error: 'Rate Limited (429)', isRateLimit: true }, 1);
    expect(kd.status).toBe('rate-limited');

    r = window.finalizeResult(kd, { valid: false, error: 'HTTP 401', isRateLimit: false }, 0);
    expect(kd.status).toBe('invalid');
    expect(kd.error).toBe('HTTP 401');
  });
});

describe('core/tester.startTesting', () => {
  test('no keys returns silently (UI layer shows alert)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    // empty textarea
    await window.startTesting();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('happy path initializes state, shows/hides sections, and calls completion', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    // provide duplicate keys to trigger dedupe message
    document.getElementById('apiKeys').value = 'sk-aaa\nsk-aaa';
    // stub dedupe to fixed output
    global.deduplicateAndCleanKeys = (keys) => ({ uniqueKeys: ['sk-aaa'], duplicates: ['sk-aaa'] });
    // stub process runner
    let ran = false;
    global.processWithFixedConcurrency = async () => { ran = true; };
    // observe completion
    let completed = false;
    global.showCompletionMessage = () => { completed = true; };

    await window.startTesting();

    // state updated
    expect(ran).toBe(true);
    expect(completed).toBe(true);
    expect(global.isTestingInProgress).toBe(false);
    // sections visibility after finally
    expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('progressBar').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('resultsSection').classList.contains('hidden')).toBe(false);
    // dedupe alert was called
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('finalizeResult maps paid for gemini when result.isPaid', () => {
    const kd = { type: 'gemini', status: 'pending', retryCount: 0, error: null };
    const r = window.finalizeResult(kd, { valid: true, error: null, isRateLimit: false, isPaid: true }, 0);
    expect(kd.status).toBe('paid');
  });

  test('already testing sets cancel flag and returns', async () => {
    global.isTestingInProgress = true;
    global.shouldCancelTesting = false;
    await window.startTesting();
    expect(global.shouldCancelTesting).toBe(true);
  });
});


