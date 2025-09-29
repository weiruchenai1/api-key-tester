import { vi } from 'vitest';
/**
 * OpenRouter API 服务测试
 */

import { testOpenRouterKey, getOpenRouterModels } from '../../services/api/openrouter';

// Mock base module
vi.mock('../../services/api/base', () => ({
  getApiUrl: vi.fn((service, endpoint, proxyUrl) => {
    if (proxyUrl) {
      return `${proxyUrl}/openrouter${endpoint}`;
    }
    return `https://openrouter.ai/api/v1${endpoint}`;
  })
}));

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('OpenRouter API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testOpenRouterKey', () => {
    const mockApiKey = 'OPENROUTER_API_KEY_EXAMPLE';
    const mockModel = 'anthropic/claude-3.5-sonnet';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!' } }]
        })
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });

      const proxyUrl = 'https://proxy.example.com';
      await testOpenRouterKey(mockApiKey, mockModel, proxyUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return rate limit error for 429 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: '速率限制',
        isRateLimit: true
      });
    });

    test('should return invalid for API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid API key',
        isRateLimit: false
      });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Network error',
        isRateLimit: false
      });
    });

    test('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
    });

    test('should handle error response without error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 500',
        isRateLimit: false
      });
    });

    test('should handle error response with null JSON data', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('JSON parse error'))
      });

      const result = await testOpenRouterKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 400',
        isRateLimit: false
      });
    });
  });

  describe('getOpenRouterModels', () => {
    const mockApiKey = 'OPENROUTER_API_KEY_EXAMPLE';

    test('should return model list for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'openai/gpt-4o', name: 'GPT-4o' },
            { id: 'google/gemini-pro', name: 'Gemini Pro' }
          ]
        })
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([
        'anthropic/claude-3.5-sonnet',
        'google/gemini-pro',
        'openai/gpt-4o'
      ]);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getOpenRouterModels(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return empty array for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should handle response with null data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: null })
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should handle response without data field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should filter out empty model IDs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'valid-model-1', name: 'Valid Model 1' },
            { id: '', name: 'Empty ID' },
            { id: null, name: 'Null ID' },
            { id: 'valid-model-2', name: 'Valid Model 2' },
            { name: 'No ID field' }
          ]
        })
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([
        'valid-model-1',
        'valid-model-2'
      ]);
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network error');
      mockFetch.mockRejectedValue(fetchError);

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取OpenRouter模型失败:', fetchError);
    });

    test('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取OpenRouter模型失败:', expect.any(Error));
    });

    test('should handle data array that is not array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: 'not an array'
        })
      });

      const result = await getOpenRouterModels(mockApiKey);

      expect(result).toEqual([]);
    });
  });
});