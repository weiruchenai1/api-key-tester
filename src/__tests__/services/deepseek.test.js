import { vi } from 'vitest';
/**
 * DeepSeek API 服务测试
 */

import { testDeepSeekKey, getDeepSeekModels } from '../../services/api/deepseek';

// Mock base module
vi.mock('../../services/api/base.js', () => ({
  getApiUrl: vi.fn((service, endpoint, proxyUrl) => {
    if (proxyUrl) {
      return `${proxyUrl}/deepseek${endpoint}`;
    }
    return `https://api.deepseek.com/v1${endpoint}`;
  })
}));

// Mock fetch
const mockFetch = vi.fn();
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('DeepSeek API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testDeepSeekKey', () => {
    const mockApiKey = 'DEEPSEEK_API_KEY_EXAMPLE';
    const mockModel = 'deepseek-chat';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!' } }]
        })
      });

      const result = await testDeepSeekKey(mockApiKey, mockModel);

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
      await testDeepSeekKey(mockApiKey, mockModel, proxyUrl);

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

      const result = await testDeepSeekKey(mockApiKey, mockModel);

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

      const result = await testDeepSeekKey(mockApiKey, mockModel);

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

      const result = await testDeepSeekKey(mockApiKey, mockModel);

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

      const result = await testDeepSeekKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 400',
        isRateLimit: false
      });
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network connection failed');
      mockFetch.mockRejectedValue(fetchError);

      const result = await testDeepSeekKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Network connection failed',
        isRateLimit: false
      });
    });

    test('should handle various HTTP status codes', async () => {
      const testCases = [
        { status: 401, expectedError: 'HTTP 401' },
        { status: 403, expectedError: 'HTTP 403' },
        { status: 404, expectedError: 'HTTP 404' },
        { status: 500, expectedError: 'HTTP 500' }
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValue({
          ok: false,
          status: testCase.status,
          json: vi.fn().mockResolvedValue({})
        });

        const result = await testDeepSeekKey(mockApiKey, mockModel);

        expect(result).toEqual({
          valid: false,
          error: testCase.expectedError,
          isRateLimit: false
        });
      }
    });

    test('should handle nested error structure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: {
            type: 'invalid_request_error',
            message: 'The model is not supported'
          }
        })
      });

      const result = await testDeepSeekKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'The model is not supported',
        isRateLimit: false
      });
    });
  });

  describe('getDeepSeekModels', () => {
    const mockApiKey = 'DEEPSEEK_API_KEY_EXAMPLE';

    test('should return models list for successful response', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'deepseek-chat', object: 'model' },
          { id: 'deepseek-coder', object: 'model' },
          { id: 'deepseek-math', object: 'model' }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-math'
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getDeepSeekModels(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return empty array for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取DeepSeek模型失败:', expect.any(Error));
    });

    test('should return empty array when data is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: null })
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should return empty array when data is undefined', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({})
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network error');
      mockFetch.mockRejectedValue(fetchError);

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取DeepSeek模型失败:', fetchError);
    });

    test('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取DeepSeek模型失败:', expect.any(Error));
    });

    test('should handle empty models array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] })
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should extract model IDs correctly', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'model-a', object: 'model', created: 1234567890 },
          { id: 'model-b', object: 'model', created: 1234567891 },
          { id: 'model-c', object: 'model', created: 1234567892 }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getDeepSeekModels(mockApiKey);

      expect(result).toEqual(['model-a', 'model-b', 'model-c']);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete DeepSeek API workflow', async () => {
      const apiKey = 'DEEPSEEK_API_KEY_EXAMPLE';

      // First get models
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'deepseek-chat' },
            { id: 'deepseek-coder' }
          ]
        })
      });

      const models = await getDeepSeekModels(apiKey);
      expect(models).toContain('deepseek-chat');

      // Then test the key with a valid model
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!' } }]
        })
      });

      const testResult = await testDeepSeekKey(apiKey, 'deepseek-chat');
      expect(testResult.valid).toBe(true);
    });

    test('should handle authentication failures consistently', async () => {
      const invalidApiKey = 'invalid-key';

      // Models request fails
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const models = await getDeepSeekModels(invalidApiKey);
      expect(models).toEqual([]);

      // Key test also fails
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      });

      const testResult = await testDeepSeekKey(invalidApiKey, 'deepseek-chat');
      expect(testResult.valid).toBe(false);
      expect(testResult.error).toBe('Invalid API key');
    });

    test('should handle rate limiting scenarios', async () => {
      const apiKey = 'DEEPSEEK_API_KEY_EXAMPLE';

      // Test rate limiting in key test
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const testResult = await testDeepSeekKey(apiKey, 'deepseek-chat');
      expect(testResult.valid).toBe(false);
      expect(testResult.isRateLimit).toBe(true);
      expect(testResult.error).toBe('速率限制');
    });
  });
});