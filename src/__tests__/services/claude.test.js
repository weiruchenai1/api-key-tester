import { vi } from 'vitest';
/**
 * Claude API 服务测试
 */

// Mock base module - must be before imports
vi.mock('../../services/api/base', () => ({
  getApiUrl: vi.fn()
}));

import { testClaudeKey, getClaudeModels } from '../../services/api/claude';
import { getApiUrl } from '../../services/api/base';

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('Claude API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup getApiUrl mock implementation
    getApiUrl.mockImplementation((service, endpoint, proxyUrl) => {
      if (proxyUrl) {
        return `${proxyUrl}${endpoint}`;
      }
      return `https://claude.weiruchenai.me/v1${endpoint}`;
    });
  });

  describe('testClaudeKey', () => {
    const mockApiKey = 'sk-ant-test123456789';
    const mockModel = 'claude-3-sonnet-20240229';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"content":[{"text":"Hello"}]}')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://claude.weiruchenai.me/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: mockModel,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        }
      );
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{}')
      });

      const proxyUrl = 'https://proxy.example.com';
      await testClaudeKey(mockApiKey, mockModel, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/messages',
        expect.any(Object)
      );
    });

    test('should return invalid for 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.authFailed401',
        isRateLimit: false
      });
    });

    test('should return invalid for 403 forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('Forbidden')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.permissionDenied403',
        isRateLimit: false
      });
    });

    test('should return rate limit error for 429', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue('Rate Limited')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.rateLimited429',
        isRateLimit: true
      });
    });

    test('should handle 400 authentication error', async () => {
      const errorResponse = {
        error: {
          type: 'authentication_error',
          message: 'Invalid API key'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse))
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: '认证错误',
        isRateLimit: false
      });
    });

    test('should handle 400 rate limit error', async () => {
      const errorResponse = {
        error: {
          type: 'rate_limit_error',
          message: 'Rate limit exceeded'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse))
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Rate Limit Error',
        isRateLimit: true
      });
    });

    test('should return valid for 400 invalid_request_error', async () => {
      const errorResponse = {
        error: {
          type: 'invalid_request_error',
          message: 'Invalid request'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse))
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
    });

    test('should handle 400 unknown error type', async () => {
      const errorResponse = {
        error: {
          type: 'unknown_error',
          message: 'Something went wrong'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse))
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'API错误: unknown_error',
        isRateLimit: false
      });
    });

    test('should handle 400 error without type', async () => {
      const errorResponse = {
        error: {
          message: 'Some error'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse))
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'API错误: unknown',
        isRateLimit: false
      });
    });

    test('should handle 400 with invalid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Invalid JSON {')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'JSON解析失败',
        isRateLimit: false
      });
    });

    test('should handle other HTTP error codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error')
      });

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'HTTP 500',
        isRateLimit: false
      });
    });

    test('should handle network errors', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: '网络连接失败',
        isRateLimit: false
      });
    });

    test('should handle other errors', async () => {
      const error = new Error('Custom error');
      mockFetch.mockRejectedValue(error);

      const result = await testClaudeKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: '请求失败: Custom error',
        isRateLimit: false
      });
    });
  });

  describe('getClaudeModels', () => {
    const mockApiKey = 'sk-ant-test123456789';

    test('should return models list for successful response', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'claude-3-sonnet-20240229', display_name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', display_name: 'Claude 3 Haiku' },
          { id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus' }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([
        'claude-3-haiku-20240307',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229'
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://claude.weiruchenai.me/v1/models',
        {
          method: 'GET',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: [] })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getClaudeModels(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/models',
        expect.any(Object)
      );
    });

    test('should return empty array for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should return empty array when data is not an array', async () => {
      const mockResponse = {
        data: null
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should return empty array when data structure is invalid', async () => {
      const mockResponse = {
        models: [{ id: 'model1' }] // Wrong structure
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
    });

    test('should handle fetch errors gracefully', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取Claude模型失败:', error);
    });

    test('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取Claude模型失败:', expect.any(Error));
    });

    test('should sort models alphabetically', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'z-model' },
          { id: 'a-model' },
          { id: 'm-model' }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual(['a-model', 'm-model', 'z-model']);
    });

    test('should handle empty models list', async () => {
      const mockModelsResponse = {
        data: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockModelsResponse)
      });

      const result = await getClaudeModels(mockApiKey);

      expect(result).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete Claude API workflow', async () => {
      const apiKey = 'sk-ant-test123456789';
      const model = 'claude-3-sonnet-20240229';

      // First get models
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'claude-3-sonnet-20240229' },
            { id: 'claude-3-haiku-20240307' }
          ]
        })
      });

      const models = await getClaudeModels(apiKey);
      expect(models).toContain(model);

      // Then test the key
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"content":[{"text":"Hello"}]}')
      });

      const testResult = await testClaudeKey(apiKey, model);
      expect(testResult.valid).toBe(true);
    });

    test('should handle authentication failures consistently', async () => {
      const apiKey = 'invalid-key';

      // Models request fails with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      });

      const models = await getClaudeModels(apiKey);
      expect(models).toEqual([]);

      // Key test also fails with 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      });

      const testResult = await testClaudeKey(apiKey, 'claude-3-sonnet-20240229');
      expect(testResult.valid).toBe(false);
      expect(testResult.error).toBe('errorMessages.authFailed401');
    });
  });
});