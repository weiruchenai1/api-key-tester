import { vi } from 'vitest';
/**
 * XAI API 服务测试
 */

// Mock base module
vi.mock('../../services/api/base.js', () => ({
  getApiUrl: vi.fn()
}));

import { testXAIKey, getXAIModels } from '../../services/api/xai';
import { getApiUrl } from '../../services/api/base.js';

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('XAI API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup getApiUrl mock implementation
    getApiUrl.mockImplementation((service, endpoint, proxyUrl) => {
      if (proxyUrl) {
        return `${proxyUrl}${endpoint}`;
      }
      return `https://api.x.ai/v1${endpoint}`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testXAIKey', () => {
    const mockApiKey = 'XAI_API_KEY_EXAMPLE';
    const mockModel = 'grok-beta';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!' } }]
        })
      });

      const result = await testXAIKey(mockApiKey, mockModel);

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
      await testXAIKey(mockApiKey, mockModel, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        `${proxyUrl}/chat/completions`,
        expect.any(Object)
      );
    });

    test('should return rate limit error for 429 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const result = await testXAIKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: '速率限制',
        isRateLimit: true
      });
    });

    test('should handle non-ok response with error message', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key provided'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue(errorResponse)
      });

      const result = await testXAIKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid API key provided',
        isRateLimit: false
      });
    });

    test('should handle non-ok response without error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      });

      const result = await testXAIKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 500',
        isRateLimit: false
      });
    });

    test('should handle JSON parsing errors in error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await testXAIKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 400',
        isRateLimit: false
      });
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network connection failed');
      mockFetch.mockRejectedValue(fetchError);

      const result = await testXAIKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Network connection failed',
        isRateLimit: false
      });
    });
  });

  describe('getXAIModels', () => {
    const mockApiKey = 'XAI_API_KEY_EXAMPLE';

    test('should return models list for successful response', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'grok-beta', object: 'model' },
          { id: 'grok-1', object: 'model' }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual(['grok-beta', 'grok-1']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getXAIModels(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        `${proxyUrl}/models`,
        expect.any(Object)
      );
    });

    test('should return empty array for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取xAI模型失败:', expect.any(Error));
    });

    test('should return empty array when data is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: null })
      });

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network error');
      mockFetch.mockRejectedValue(fetchError);

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取xAI模型失败:', fetchError);
    });
  });
});