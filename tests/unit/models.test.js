import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ui/models + services/modelsService', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="apiType">
        <option value="openai">openai</option>
        <option value="claude">claude</option>
        <option value="gemini">gemini</option>
      </select>
      <select id="modelSelect"></select>
      <input id="modelInput" class="hidden" />
      <button id="modelToggleBtn"></button>

      <div id="detectedModels" style="display:none">
        <div id="detectedModelsHeader"><h4></h4></div>
        <div id="modelListContainer" class="model-list-container"><div id="modelList"></div></div>
        <span id="collapseIcon" class="collapse-icon collapsed">▼</span>
      </div>

      <div id="loading" class="hidden"><p>...</p></div>
      <textarea id="apiKeys"></textarea>
    `;
    window.currentLang = 'zh';
    window.isCustomModel = false;
    window.detectedModels = new Set();
    window.modelOptions = {
      openai: ['gpt-4o', 'gpt-4o-mini'],
      claude: ['claude-3-5-sonnet-20241022'],
      gemini: ['gemini-2.0-flash']
    };
    vi.stubGlobal('alert', vi.fn());
  });

  it('updateModelOptions 根据 apiType 渲染选项', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/ui/models.js');
    document.getElementById('apiType').value = 'openai';
    window.updateModelOptions();
    expect(document.getElementById('modelSelect').options.length).toBe(2);
  });

  it('toggleModelInput 与 getSelectedModel', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/ui/models.js');
    // 初始：预设
    document.getElementById('modelSelect').innerHTML = '<option value="gpt-4o" selected>gpt-4o</option>';
    expect(window.getSelectedModel()).toBe('gpt-4o');
    // 切换到自定义
    window.toggleModelInput();
    document.getElementById('modelInput').value = 'custom-model';
    expect(window.getSelectedModel()).toBe('custom-model');
  });

  it('addDetectedModel/updateDetectedModelsList/selectDetectedModel 与 toggleModelList', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/ui/models.js');
    window.addDetectedModel('gemini-2.0-flash');
    const dm = document.getElementById('detectedModels');
    expect(dm.style.display).toBe('block');
    expect(document.getElementById('modelList').textContent).toContain('gemini-2.0-flash');
    // 点击选择
    document.querySelector('#modelList .model-tag').click();
    expect(document.getElementById('modelSelect').value).toBe('gemini-2.0-flash');
    // 折叠/展开
    const container = document.getElementById('modelListContainer');
    const before = container.classList.contains('expanded');
    window.toggleModelList();
    expect(container.classList.contains('expanded')).toBe(!before);
  });

  it('detectModels 校验空输入与无可用模型/有模型', async () => {
    await import('../../js/i18n/translations.js');
    await import('../../js/ui/models.js');
    // 空输入提示
    document.getElementById('apiKeys').value = '';
    await window.detectModels();
    expect(window.alert).toHaveBeenCalled();
    // 无可用模型
    window.alert.mockClear();
    document.getElementById('apiKeys').value = 'sk-xxx';
    window.getAvailableModels = vi.fn().mockResolvedValueOnce([]);
    await window.detectModels();
    expect(window.alert).toHaveBeenCalled();
    // 有模型
    window.alert.mockClear();
    window.detectedModels.clear();
    window.getAvailableModels = vi.fn().mockResolvedValueOnce(['gemini-2.0-flash']);
    await window.detectModels();
    expect(document.getElementById('modelList').textContent).toContain('gemini-2.0-flash');
  });

  it('services/modelsService: getAvailableModels 路由到对应服务', async () => {
    await import('../../js/services/modelsService.js');
    window.getOpenAIModels = vi.fn().mockResolvedValueOnce(['a']);
    window.getClaudeModels = vi.fn().mockResolvedValueOnce(['b']);
    window.getGeminiModels = vi.fn().mockResolvedValueOnce(['c']);
    await expect(window.getAvailableModels('k', 'openai')).resolves.toEqual(['a']);
    await expect(window.getAvailableModels('k', 'claude')).resolves.toEqual(['b']);
    await expect(window.getAvailableModels('k', 'gemini')).resolves.toEqual(['c']);
    await expect(window.getAvailableModels('k', 'other')).resolves.toEqual([]);
  });
});


