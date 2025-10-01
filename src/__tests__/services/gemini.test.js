import { vi } from 'vitest';
/**
 * Gemini API服务测试
 */

import { testGeminiKey, getGeminiModels } from '../../services/api/gemini';
import { getApiUrl } from '../../services/api/base';

// Mock the base module
vi.mock('../../services/api/base', () => ({
  getApiUrl: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('Gemini API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApiUrl.mockReturnValue('https://gemini.weiruchenai.me/v1beta');
  });

  describe('testGeminiKey', () => {
    test('should return valid for successful response', async () => {
      const mockResponseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello' }]
            }
          }
        ]
      };
      
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData))
      };
      
      fetch.mockResolvedValue(mockResponse);
      getApiUrl.mockReturnValue('https://gemini.weiruchenai.me/v1beta/models/gemini-pro:generateContent');
      
      const result = await testGeminiKey('test-key', 'gemini-pro', 'proxy-url');
      
      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
      
      expect(fetch).toHaveBeenCalledWith(
        'https://gemini.weiruchenai.me/v1beta/models/gemini-pro:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Hi' }]
              }
            ]
          })
        }
      );
    });

    test('should handle 400 authentication error', async () => {
      const mockResponse = {
        ok: false,
        status: 400
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testGeminiKey('invalid-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.invalidApiKey',
        isRateLimit: false
      });
    });

    test('should handle 429 rate limit error', async () => {
      const mockResponse = {
        ok: false,
        status: 429
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testGeminiKey('test-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: 'errorMessages.rateLimited429',
        isRateLimit: true
      });
    });

    test('should handle rate limit keywords in error message', async () => {
      const mockResponseData = {
        error: {
          message: 'Quota exceeded - Resource has been exhausted (e.g. check quota)'
        }
      };
      
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData))
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testGeminiKey('test-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: 'Rate Limited: Quota exceeded - Resource has been exhausted (e.g. check quota)',
        isRateLimit: true
      });
    });

    test('should handle invalid response format', async () => {
      const mockResponseData = {
        invalidField: 'value'
      };
      
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponseData))
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testGeminiKey('test-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: '响应格式错误',
        isRateLimit: false
      });
    });

    test('should handle network error', async () => {
      fetch.mockRejectedValue(new TypeError('fetch failed'));
      
      const result = await testGeminiKey('test-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: '网络连接失败',
        isRateLimit: false
      });
    });

    test('should handle JSON parse error', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('invalid json')
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await testGeminiKey('test-key', 'gemini-pro');
      
      expect(result).toEqual({
        valid: false,
        error: 'JSON解析失败',
        isRateLimit: false
      });
    });
  });

  describe('getGeminiModels', () => {
    test('should return model list from models endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          models: [
            { 
              name: 'models/gemini-pro',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/gemini-pro-vision',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/text-bison-001',
              supportedGenerationMethods: ['embedding'] // Should be filtered out
            }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      getApiUrl.mockReturnValue('https://gemini.weiruchenai.me/v1beta/models?key=test-key');
      
      const result = await getGeminiModels('test-key', 'proxy-url');
      
      expect(result).toEqual(['gemini-pro', 'gemini-pro-vision']);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://gemini.weiruchenai.me/v1beta/models?key=test-key',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    test('should return empty array when API call fails', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getGeminiModels('invalid-key');
      
      expect(result).toEqual([]);
    });

    test('should handle network error gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await getGeminiModels('test-key');
      
      expect(result).toEqual([]);
    });

    test('should filter gemini models correctly', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          models: [
            { 
              name: 'models/gemini-1.5-flash',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/gemini-1.5-pro',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/gemini-pro',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/gemini-pro-vision',
              supportedGenerationMethods: ['generateContent']
            },
            { 
              name: 'models/text-bison-001',
              supportedGenerationMethods: ['embedding']
            },
            { 
              name: 'models/chat-bison-001',
              supportedGenerationMethods: ['chat']
            },
            { 
              name: 'models/embedding-001',
              supportedGenerationMethods: ['embedding']
            }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getGeminiModels('test-key');
      
      expect(result).toEqual([
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-pro-vision'
      ]);
    });

    test('should handle invalid response format', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          invalidField: 'value'
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await getGeminiModels('test-key');
      
      expect(result).toEqual([]);
    });
  });
});