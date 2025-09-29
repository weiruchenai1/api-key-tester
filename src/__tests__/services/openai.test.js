import { vi } from 'vitest';
/**
 * OpenAI API服务测试
 */

import { testOpenAIKey, getOpenAIModels } from '../../services/api/openai';
import { getApiUrl } from '../../services/api/base';

// Mock the base module
vi.mock('../../services/api/base', () => ({
  getApiUrl: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('OpenAI API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApiUrl.mockReturnValue('https://api.openai.com/v1');
  });

  describe('testOpenAIKey', () => {
    test('should return valid for successful response', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Hello' } }]
        }))
      };
      
      fetch.mockResolvedValue(mockResponse);
      getApiUrl.mockReturnValue('https://api.openai.com/v1/chat/completions');
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo', 'proxy-url');
      
      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
      
      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1
        })
      });
    });

    test('should handle 401 authentication error', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('invalid-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.authFailed401',
        isRateLimit: false
      });
    });

    test('should handle 403 permission error', async () => {
      const mockResponse = {
        ok: false,
        status: 403
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-4');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.permissionDenied403',
        isRateLimit: false
      });
    });

    test('should handle 429 rate limit error', async () => {
      const mockResponse = {
        ok: false,
        status: 429
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.rateLimited429',
        isRateLimit: true
      });
    });

    test('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('')
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.emptyResponse',
        isRateLimit: false
      });
    });

    test('should handle JSON parse error', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('invalid json')
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: 'JSON解析失败',
        isRateLimit: false
      });
    });

    test('should handle rate limit error in response body', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({
          error: {
            message: 'Rate limit exceeded'
          }
        }))
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: 'Rate Limited: Rate limit exceeded',
        isRateLimit: true
      });
    });

    test('should handle invalid response format', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({
          invalidField: 'value'
        }))
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: '响应格式错误',
        isRateLimit: false
      });
    });

    test('should handle network error', async () => {
      fetch.mockRejectedValue(new TypeError('fetch failed'));
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: '网络连接失败',
        isRateLimit: false
      });
    });

    test('should handle generic error', async () => {
      fetch.mockRejectedValue(new Error('Something went wrong'));
      
      const result = await testOpenAIKey('test-key', 'gpt-3.5-turbo');
      
      expect(result).toEqual({
        valid: false,
        error: '请求失败: Something went wrong',
        isRateLimit: false
      });
    });
  });

  describe('getOpenAIModels', () => {
    test('should return filtered model list', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-3.5-turbo' },
            { id: 'gpt-4' },
            { id: 'text-embedding-ada-002' }, // Should be filtered out
            { id: 'whisper-1' }, // Should be filtered out
            { id: 'dall-e-3' }, // Should be filtered out
            { id: 'text-moderation-latest' }, // Should be filtered out
            { id: 'gpt-4-turbo' }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      getApiUrl.mockReturnValue('https://api.openai.com/v1/models');
      
      const result = await getOpenAIModels('test-key', 'proxy-url');
      
      expect(result).toEqual(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']);
      
      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        }
      });
    });

    test('should return empty array for failed request', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getOpenAIModels('invalid-key');
      
      expect(result).toEqual([]);
    });

    test('should return empty array for invalid response format', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          invalidField: 'value'
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getOpenAIModels('test-key');
      
      expect(result).toEqual([]);
    });

    test('should handle network error gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await getOpenAIModels('test-key');
      
      expect(result).toEqual([]);
    });

    test('should filter out non-chat models correctly', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-3.5-turbo' },
            { id: 'text-embedding-3-small' },
            { id: 'text-embedding-3-large' },
            { id: 'whisper-1' },
            { id: 'tts-1' },
            { id: 'tts-1-hd' },
            { id: 'dall-e-2' },
            { id: 'dall-e-3' },
            { id: 'text-moderation-stable' },
            { id: 'text-moderation-latest' },
            { id: 'text-search-ada-doc-001' },
            { id: 'text-similarity-ada-001' }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getOpenAIModels('test-key');
      
      expect(result).toEqual(['gpt-3.5-turbo']);
    });
  });
});