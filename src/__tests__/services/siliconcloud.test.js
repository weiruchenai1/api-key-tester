/**
 * SiliconCloud API 服务测试
 */

import { testSiliconCloudKey, getSiliconCloudModels, getSiliconCloudBalance } from '../../services/api/siliconcloud';

// Mock base module
jest.mock('../../services/api/base', () => ({
  getApiUrl: jest.fn((service, endpoint, proxyUrl) => {
    if (proxyUrl) {
      return `${proxyUrl}/siliconcloud${endpoint}`;
    }
    return `https://api.siliconflow.cn/v1${endpoint}`;
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

describe('SiliconCloud API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('testSiliconCloudKey', () => {
    const mockApiKey = 'SILICONCLOUD_API_KEY_EXAMPLE';
    const mockModel = 'Qwen/Qwen2-72B-Instruct';

    test('should return valid for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!' } }]
        })
      });

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

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
      await testSiliconCloudKey(mockApiKey, mockModel, proxyUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should return rate limit error for 429 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

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
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      });

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid API key',
        isRateLimit: false
      });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

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
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
    });

    test('should handle empty response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({})
      });

      const result = await testSiliconCloudKey(mockApiKey, mockModel);

      expect(result).toEqual({
        valid: true,
        error: null,
        isRateLimit: false
      });
    });
  });

  describe('getSiliconCloudModels', () => {
    const mockApiKey = 'SILICONCLOUD_API_KEY_EXAMPLE';

    test('should return model list for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: [
            { id: 'Qwen/Qwen2-72B-Instruct', object: 'model' },
            { id: 'deepseek-ai/DeepSeek-V2-Chat', object: 'model' }
          ]
        })
      });

      const result = await getSiliconCloudModels(mockApiKey);

      expect(result).toEqual([
        'Qwen/Qwen2-72B-Instruct',
        'deepseek-ai/DeepSeek-V2-Chat'
      ]);
    });

    test('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Unauthorized' }
        })
      });

      const result = await getSiliconCloudModels(mockApiKey);

      expect(result).toEqual([]);
    });
  });

  describe('getSiliconCloudBalance', () => {
    const mockApiKey = 'SILICONCLOUD_API_KEY_EXAMPLE';

    test('should return balance info for successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: {
            balance: 1000,
            currency: 'CNY'
          }
        })
      });

      const result = await getSiliconCloudBalance(mockApiKey);

      expect(result).toEqual({
        balance: 1000,
        currency: 'CNY',
        success: true,
        userInfo: {
          userId: undefined,
          email: undefined,
          nickname: undefined
        }
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should use proxy URL when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          data: { balance: 1000, currency: 'CNY' }
        })
      });

      const proxyUrl = 'https://proxy.example.com';
      await getSiliconCloudBalance(mockApiKey, proxyUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Unauthorized' }
        })
      });

      const result = await getSiliconCloudBalance(mockApiKey);

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
        balance: null
      });
    });
  });
});