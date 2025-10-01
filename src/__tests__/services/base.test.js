import { vi } from 'vitest';
/**
 * API服务基础功能测试
 */

import { getApiUrl, testApiKey, getAvailableModels, getApiBalance } from '../../services/api/base.js';

// Mock all API service modules
vi.mock('../../services/api/openai', () => ({
  testOpenAIKey: vi.fn(),
  getOpenAIModels: vi.fn()
}));

vi.mock('../../services/api/claude', () => ({
  testClaudeKey: vi.fn(),
  getClaudeModels: vi.fn()
}));

vi.mock('../../services/api/gemini', () => ({
  testGeminiKey: vi.fn(),
  getGeminiModels: vi.fn()
}));

vi.mock('../../services/api/deepseek', () => ({
  testDeepSeekKey: vi.fn(),
  getDeepSeekModels: vi.fn()
}));

vi.mock('../../services/api/siliconcloud', () => ({
  testSiliconCloudKey: vi.fn(),
  getSiliconCloudModels: vi.fn(),
  getSiliconCloudBalance: vi.fn()
}));

vi.mock('../../services/api/xai', () => ({
  testXAIKey: vi.fn(),
  getXAIModels: vi.fn()
}));

vi.mock('../../services/api/openrouter', () => ({
  testOpenRouterKey: vi.fn(),
  getOpenRouterModels: vi.fn()
}));

describe('API Base Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApiUrl', () => {
    test('should use proxy URL when provided', () => {
      const proxyUrl = 'https://proxy.example.com';
      const endpoint = '/test';
      
      expect(getApiUrl('openai', endpoint, proxyUrl)).toBe('https://proxy.example.com/test');
    });

    test('should remove trailing slash from proxy URL', () => {
      const proxyUrl = 'https://proxy.example.com/';
      const endpoint = '/test';
      
      expect(getApiUrl('openai', endpoint, proxyUrl)).toBe('https://proxy.example.com/test');
    });

    test('should return correct default URLs for each API type', () => {
      const endpoint = '/test';
      
      expect(getApiUrl('openai', endpoint)).toBe('https://openai.weiruchenai.me/v1/test');
      expect(getApiUrl('claude', endpoint)).toBe('https://claude.weiruchenai.me/v1/test');
      expect(getApiUrl('gemini', endpoint)).toBe('https://gemini.weiruchenai.me/v1beta/test');
      expect(getApiUrl('deepseek', endpoint)).toBe('https://api.deepseek.com/v1/test');
      expect(getApiUrl('siliconcloud', endpoint)).toBe('https://api.siliconflow.cn/v1/test');
      expect(getApiUrl('xai', endpoint)).toBe('https://api.x.ai/v1/test');
      expect(getApiUrl('openrouter', endpoint)).toBe('https://openrouter.ai/api/v1/test');
    });

    test('should throw error for unsupported API type', () => {
      expect(() => getApiUrl('unsupported', '/test')).toThrow('Unsupported API type: unsupported');
    });
  });

  describe('testApiKey', () => {
    test('should call correct API test function', async () => {
      const { testOpenAIKey } = await import('../../services/api/openai.js');
      const { testClaudeKey } = await import('../../services/api/claude.js');
      
      testOpenAIKey.mockResolvedValue({ valid: true });
      testClaudeKey.mockResolvedValue({ valid: true });
      
      await testApiKey('test-key', 'openai', 'model', 'proxy');
      expect(testOpenAIKey).toHaveBeenCalledWith('test-key', 'model', 'proxy');
      
      await testApiKey('test-key', 'claude', 'model', 'proxy');
      expect(testClaudeKey).toHaveBeenCalledWith('test-key', 'model', 'proxy');
    });

    test('should return error for unsupported API type', async () => {
      const result = await testApiKey('test-key', 'unsupported', 'model');
      
      expect(result).toEqual({
        valid: false,
        error: '不支持的API类型',
        isRateLimit: false
      });
    });
  });

  describe('getAvailableModels', () => {
    test('should call correct model fetcher function', async () => {
      const { getOpenAIModels } = await import('../../services/api/openai.js');
      const { getGeminiModels } = await import('../../services/api/gemini.js');
      
      getOpenAIModels.mockResolvedValue(['gpt-3.5-turbo', 'gpt-4']);
      getGeminiModels.mockResolvedValue(['gemini-pro']);
      
      const openaiModels = await getAvailableModels('test-key', 'openai', 'proxy');
      expect(openaiModels).toEqual(['gpt-3.5-turbo', 'gpt-4']);
      expect(getOpenAIModels).toHaveBeenCalledWith('test-key', 'proxy');
      
      const geminiModels = await getAvailableModels('test-key', 'gemini', 'proxy');
      expect(geminiModels).toEqual(['gemini-pro']);
      expect(getGeminiModels).toHaveBeenCalledWith('test-key', 'proxy');
    });

    test('should return empty array for unsupported API type', async () => {
      const result = await getAvailableModels('test-key', 'unsupported');
      expect(result).toEqual([]);
    });

    test('should handle errors gracefully', async () => {
      const { getOpenAIModels } = await import('../../services/api/openai.js');
      getOpenAIModels.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      const result = await getAvailableModels('test-key', 'openai');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('获取可用模型失败:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getApiBalance', () => {
    test('should call SiliconCloud balance function', async () => {
      const { getSiliconCloudBalance } = await import('../../services/api/siliconcloud.js');
      getSiliconCloudBalance.mockResolvedValue({ success: true, balance: 100 });
      
      const result = await getApiBalance('test-key', 'siliconcloud', 'proxy');
      expect(result).toEqual({ success: true, balance: 100 });
      expect(getSiliconCloudBalance).toHaveBeenCalledWith('test-key', 'proxy');
    });

    test('should return not supported error for other API types', async () => {
      const apiTypes = ['openai', 'claude', 'gemini', 'deepseek', 'xai', 'openrouter'];
      
      for (const apiType of apiTypes) {
        const result = await getApiBalance('test-key', apiType);
        expect(result).toEqual({
          success: false,
          error: '该API类型暂不支持余额查询',
          balance: null
        });
      }
    });

    test('should return error for unsupported API type', async () => {
      const result = await getApiBalance('test-key', 'unsupported');
      expect(result).toEqual({
        success: false,
        error: '不支持的API类型',
        balance: null
      });
    });

    test('should handle errors gracefully', async () => {
      const { getSiliconCloudBalance } = await import('../../services/api/siliconcloud.js');
      getSiliconCloudBalance.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      const result = await getApiBalance('test-key', 'siliconcloud');
      expect(result).toEqual({
        success: false,
        error: 'Network error',
        balance: null
      });
      expect(consoleSpy).toHaveBeenCalledWith('获取API余额失败:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});