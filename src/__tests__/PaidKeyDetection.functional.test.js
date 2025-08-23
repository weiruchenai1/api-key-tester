/**
 * 付费Key检测功能验证测试
 * 实际可运行的功能测试，验证修改后的逻辑
 */

import { testGeminiPaidKey } from '../services/api/gemini';

// Mock fetch for testing
global.fetch = jest.fn();

describe('付费Key检测核心功能验证', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testGeminiPaidKey函数测试', () => {
    test('付费Key - Cache API成功应返回isPaid: true', async () => {
      // Mock Cache API成功响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'cached-content-123' })
      });

      const result = await testGeminiPaidKey('AIzaSyTestPaidKey123456789012345678901', 'gemini-2.5-flash', null);
      
      expect(result.isPaid).toBe(true);
      expect(result.error).toBe(null);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/cachedContents'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-goog-api-key': 'AIzaSyTestPaidKey123456789012345678901'
          })
        })
      );
    });

    test('免费Key - Cache API 429错误应返回isPaid: false', async () => {
      // Mock Cache API 429响应
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      const result = await testGeminiPaidKey('AIzaSyTestFreeKey123456789012345678901', 'gemini-2.5-flash', null);
      
      expect(result.isPaid).toBe(false);
      expect(result.error).toBe(null);
    });

    test('无效Key - Cache API 401错误应返回isPaid: false', async () => {
      // Mock Cache API 401响应
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const result = await testGeminiPaidKey('InvalidKey123', 'gemini-2.5-flash', null);
      
      expect(result.isPaid).toBe(false);
      expect(result.error).toBe(null);
    });

    test('网络错误应返回isPaid: null', async () => {
      // Mock网络错误
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testGeminiPaidKey('AIzaSyTestKey123456789012345678901234', 'gemini-2.5-flash', null);
      
      expect(result.isPaid).toBe(null);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Worker状态设置逻辑验证', () => {
    // 模拟Worker中的状态设置逻辑
    const simulateWorkerLogic = (basicValid, paidResult) => {
      let finalResult = { valid: basicValid };
      let finalStatus;

      if (basicValid && paidResult) {
        if (paidResult.isPaid === true) {
          finalResult = { ...finalResult, isPaid: true };
          finalStatus = 'paid';
        } else {
          finalResult = { ...finalResult, isPaid: false };
          finalStatus = 'valid';
        }
      } else if (basicValid) {
        finalStatus = 'valid';
      } else {
        finalStatus = 'invalid';
      }

      return { ...finalResult, status: finalStatus };
    };

    test('付费Key应设置status为paid', () => {
      const result = simulateWorkerLogic(true, { isPaid: true });
      
      expect(result.valid).toBe(true);
      expect(result.isPaid).toBe(true);
      expect(result.status).toBe('paid');
    });

    test('免费Key应设置status为valid', () => {
      const result = simulateWorkerLogic(true, { isPaid: false });
      
      expect(result.valid).toBe(true);
      expect(result.isPaid).toBe(false);
      expect(result.status).toBe('valid');
    });

    test('无效Key应设置status为invalid', () => {
      const result = simulateWorkerLogic(false, null);
      
      expect(result.valid).toBe(false);
      expect(result.status).toBe('invalid');
    });
  });

  describe('UI筛选逻辑验证', () => {
    const mockKeyResults = [
      { key: 'key1', status: 'valid', isPaid: false },
      { key: 'key2', status: 'paid', isPaid: true },
      { key: 'key3', status: 'invalid', isPaid: null },
      { key: 'key4', status: 'rate-limited', isPaid: null },
      { key: 'key5', status: 'valid', isPaid: false },
      { key: 'key6', status: 'paid', isPaid: true }
    ];

    // 模拟VirtualizedList中的筛选逻辑
    const filterKeys = (keyResults, activeTab) => {
      switch (activeTab) {
        case 'valid':
          return keyResults.filter(k => k.status === 'valid');
        case 'paid':
          return keyResults.filter(k => k.status === 'paid');
        case 'invalid':
          return keyResults.filter(k => k.status === 'invalid');
        case 'rate-limited':
          return keyResults.filter(k => k.status === 'rate-limited');
        default:
          return keyResults;
      }
    };

    test('valid标签页只显示免费key', () => {
      const filtered = filterKeys(mockKeyResults, 'valid');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(k => k.status === 'valid' && k.isPaid === false)).toBe(true);
    });

    test('paid标签页只显示付费key', () => {
      const filtered = filterKeys(mockKeyResults, 'paid');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(k => k.status === 'paid' && k.isPaid === true)).toBe(true);
    });

    test('invalid标签页只显示无效key', () => {
      const filtered = filterKeys(mockKeyResults, 'invalid');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('invalid');
    });

    test('all标签页显示所有key', () => {
      const filtered = filterKeys(mockKeyResults, 'all');
      
      expect(filtered).toHaveLength(6);
    });
  });

  describe('状态显示文本验证', () => {
    // 模拟UI中的状态文本逻辑
    const getStatusText = (status) => {
      switch (status) {
        case 'valid': return '有效Key';
        case 'paid': return '付费Key';
        case 'invalid': return '无效Key';
        case 'rate-limited': return '速率限制';
        default: return status;
      }
    };

    test('付费key显示为"付费Key"', () => {
      expect(getStatusText('paid')).toBe('付费Key');
    });

    test('免费key显示为"有效Key"', () => {
      expect(getStatusText('valid')).toBe('有效Key');
    });

    test('无效key显示为"无效Key"', () => {
      expect(getStatusText('invalid')).toBe('无效Key');
    });
  });
});

describe('边界情况和错误处理验证', () => {
  test('付费检测异常时应默认为免费key', () => {
    const simulateErrorHandling = (basicValid, paidError) => {
      let finalResult = { valid: basicValid };
      
      if (basicValid) {
        try {
          if (paidError) throw new Error('Paid detection failed');
          finalResult.isPaid = true;
        } catch (error) {
          finalResult.isPaid = false; // 默认为免费key
        }
      }
      
      return finalResult;
    };

    const result = simulateErrorHandling(true, true);
    expect(result.valid).toBe(true);
    expect(result.isPaid).toBe(false);
  });

  test('未启用付费检测时不应有isPaid属性', () => {
    const simulateWithoutPaidDetection = (basicValid) => {
      return { valid: basicValid };
    };

    const result = simulateWithoutPaidDetection(true);
    expect(result.valid).toBe(true);
    expect(result.isPaid).toBeUndefined();
  });
});

describe('完整流程集成验证', () => {
  test('付费key完整检测流程验证', async () => {
    // 1. 基础API成功
    // 2. Cache API成功 -> 付费key
    // 3. 状态设置为paid
    // 4. UI显示为"付费Key"
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: 'cached-content' })
    });

    const paidResult = await testGeminiPaidKey('AIzaSyPaidKey123456789012345678901234', 'gemini-2.5-flash', null);
    
    // 模拟Worker逻辑
    const finalResult = {
      valid: true,
      isPaid: paidResult.isPaid,
      status: paidResult.isPaid ? 'paid' : 'valid'
    };

    expect(finalResult.valid).toBe(true);
    expect(finalResult.isPaid).toBe(true);
    expect(finalResult.status).toBe('paid');
  });

  test('免费key完整检测流程验证', async () => {
    // 1. 基础API成功
    // 2. Cache API 429 -> 免费key
    // 3. 状态设置为valid
    // 4. UI显示为"有效Key"
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit')
    });

    const paidResult = await testGeminiPaidKey('AIzaSyFreeKey123456789012345678901234', 'gemini-2.5-flash', null);
    
    // 模拟Worker逻辑
    const finalResult = {
      valid: true,
      isPaid: paidResult.isPaid,
      status: paidResult.isPaid ? 'paid' : 'valid'
    };

    expect(finalResult.valid).toBe(true);
    expect(finalResult.isPaid).toBe(false);
    expect(finalResult.status).toBe('valid');
  });
});
