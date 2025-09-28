/**
 * XAI API 服务测试
 */

import { testXAIKey, getXAIModels } from '../../services/api/xai';

// Mock base module
jest.mock('../../services/api/base', () => ({
  getApiUrl: jest.fn((service, endpoint, proxyUrl) => {
    if (proxyUrl) {
      return `${proxyUrl}/xai${endpoint}`;
    }
    return `https://api.x.ai/v1${endpoint}`;
  })
}));

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('XAI API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('testXAIKey', () => {
    const mockApiKey = 'xai-test123456789';
    const mockModel = 'grok-beta';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
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
        json: jest.fn().mockResolvedValue({})
      });

      const proxyUrl = 'https://proxy.example.com';
      await testXAIKey(mockApiKey, mockModel, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        `${proxyUrl}/xai/chat/completions`,
        expect.any(Object)
      );
    });

    test('should return rate limit error for 429 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
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
        json: jest.fn().mockResolvedValue(errorResponse)
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
        json: jest.fn().mockResolvedValue({})
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
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
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
    const mockApiKey = 'xai-test123456789';

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
        json: jest.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual(['grok-beta', 'grok-1']);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [] })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getXAIModels(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        `${proxyUrl}/xai/models`,
        expect.any(Object)
      );
    });

    test('should return empty array for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const result = await getXAIModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取xAI模型失败:', expect.any(Error));
    });

    test('should return empty array when data is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: null })
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