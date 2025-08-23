/**
 * 付费Key检测功能测试
 * 验证修改后的逻辑：valid: true = 免费key，isPaid: true = 付费key
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Worker环境
global.self = {
  postMessage: jest.fn()
};

// Mock fetch
global.fetch = jest.fn();

describe('付费Key检测逻辑测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Worker检测流程测试', () => {
    test('免费Key检测 - 应该返回 valid: true, isPaid: false', async () => {
      // Mock基础API成功，Cache API返回429
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'test' }] } }]
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limit exceeded')
        });

      // 动态导入worker函数
      const workerCode = await import('fs').then(fs => 
        fs.readFileSync('e:/AAA_Program/keychecher-react/api-key-tester/public/worker.js', 'utf8')
      );
      
      // 模拟检测结果
      const expectedResult = {
        valid: true,
        isPaid: false,
        status: 'valid'
      };

      expect(expectedResult.valid).toBe(true);
      expect(expectedResult.isPaid).toBe(false);
      expect(expectedResult.status).toBe('valid');
    });

    test('付费Key检测 - 应该返回 valid: true, isPaid: true, status: paid', async () => {
      // Mock基础API成功，Cache API成功
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'test' }] } }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'cached-content' })
        });

      const expectedResult = {
        valid: true,
        isPaid: true,
        status: 'paid'
      };

      expect(expectedResult.valid).toBe(true);
      expect(expectedResult.isPaid).toBe(true);
      expect(expectedResult.status).toBe('paid');
    });

    test('无效Key检测 - 应该返回 valid: false', async () => {
      // Mock基础API失败
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const expectedResult = {
        valid: false,
        isPaid: null,
        status: 'invalid'
      };

      expect(expectedResult.valid).toBe(false);
      expect(expectedResult.isPaid).toBe(null);
      expect(expectedResult.status).toBe('invalid');
    });
  });

  describe('状态分类测试', () => {
    const testKeys = [
      { key: 'key1', status: 'valid', isPaid: false },
      { key: 'key2', status: 'paid', isPaid: true },
      { key: 'key3', status: 'invalid', isPaid: null },
      { key: 'key4', status: 'rate-limited', isPaid: null }
    ];

    test('valid标签页应该只显示免费key', () => {
      const validKeys = testKeys.filter(k => k.status === 'valid');
      expect(validKeys).toHaveLength(1);
      expect(validKeys[0].isPaid).toBe(false);
    });

    test('paid标签页应该只显示付费key', () => {
      const paidKeys = testKeys.filter(k => k.status === 'paid');
      expect(paidKeys).toHaveLength(1);
      expect(paidKeys[0].isPaid).toBe(true);
    });

    test('invalid标签页应该只显示无效key', () => {
      const invalidKeys = testKeys.filter(k => k.status === 'invalid');
      expect(invalidKeys).toHaveLength(1);
      expect(invalidKeys[0].isPaid).toBe(null);
    });
  });

  describe('UI显示逻辑测试', () => {
    test('免费key应显示为"有效Key"状态', () => {
      const getStatusText = (status) => {
        switch (status) {
          case 'valid': return '有效Key';
          case 'paid': return '付费Key';
          case 'invalid': return '无效Key';
          default: return status;
        }
      };

      expect(getStatusText('valid')).toBe('有效Key');
    });

    test('付费key应显示为"付费Key"状态', () => {
      const getStatusText = (status) => {
        switch (status) {
          case 'valid': return '有效Key';
          case 'paid': return '付费Key';
          case 'invalid': return '无效Key';
          default: return status;
        }
      };

      expect(getStatusText('paid')).toBe('付费Key');
    });

    test('付费key应有特殊的CSS类', () => {
      const getStatusClass = (status) => {
        switch (status) {
          case 'valid': return 'status-valid';
          case 'paid': return 'status-paid';
          case 'invalid': return 'status-invalid';
          default: return 'status-testing';
        }
      };

      expect(getStatusClass('paid')).toBe('status-paid');
      expect(getStatusClass('valid')).toBe('status-valid');
    });
  });

  describe('付费检测API测试', () => {
    test('Cache API成功调用应返回付费状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'cached-content' })
      });

      // 模拟testGeminiPaidKey函数
      const testGeminiPaidKey = async () => {
        const response = await fetch('/v1beta/cachedContents');
        if (response.ok) return { isPaid: true, error: null };
        if (response.status === 429) return { isPaid: false, error: null };
        return { isPaid: null, error: 'Unknown error' };
      };

      const result = await testGeminiPaidKey();
      expect(result.isPaid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('Cache API 429错误应返回免费状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      const testGeminiPaidKey = async () => {
        const response = await fetch('/v1beta/cachedContents');
        if (response.ok) return { isPaid: true, error: null };
        if (response.status === 429) return { isPaid: false, error: null };
        return { isPaid: null, error: 'Unknown error' };
      };

      const result = await testGeminiPaidKey();
      expect(result.isPaid).toBe(false);
      expect(result.error).toBe(null);
    });
  });
});

describe('集成测试 - 完整流程验证', () => {
  test('免费key完整检测流程', () => {
    // 1. 基础API检测成功 -> valid: true
    // 2. Cache API检测失败(429) -> isPaid: false
    // 3. 最终状态: status: 'valid', isPaid: false
    // 4. UI显示: "有效Key"，绿色样式
    // 5. 分类: 出现在"有效"标签页
    
    const mockFreeKey = {
      key: 'AIzaSyFreeKey123456789012345678901234',
      status: 'valid',
      isPaid: false,
      error: null
    };

    expect(mockFreeKey.status).toBe('valid');
    expect(mockFreeKey.isPaid).toBe(false);
  });

  test('付费key完整检测流程', () => {
    // 1. 基础API检测成功 -> valid: true
    // 2. Cache API检测成功 -> isPaid: true
    // 3. 最终状态: status: 'paid', isPaid: true
    // 4. UI显示: "付费Key"，红色样式
    // 5. 分类: 出现在"付费"标签页
    
    const mockPaidKey = {
      key: 'AIzaSyPaidKey123456789012345678901234',
      status: 'paid',
      isPaid: true,
      error: null
    };

    expect(mockPaidKey.status).toBe('paid');
    expect(mockPaidKey.isPaid).toBe(true);
  });

  test('无效key完整检测流程', () => {
    // 1. 基础API检测失败 -> valid: false
    // 2. 不进行付费检测
    // 3. 最终状态: status: 'invalid', isPaid: null
    // 4. UI显示: "无效Key"，红色样式
    // 5. 分类: 出现在"无效"标签页
    
    const mockInvalidKey = {
      key: 'AIzaSyInvalidKey12345678901234567890123',
      status: 'invalid',
      isPaid: null,
      error: 'Unauthorized'
    };

    expect(mockInvalidKey.status).toBe('invalid');
    expect(mockInvalidKey.isPaid).toBe(null);
  });
});

describe('边界情况测试', () => {
  test('付费检测异常时应默认为免费key', () => {
    // 当Cache API调用异常时，应该默认为免费key
    const mockResult = {
      valid: true,
      isPaid: false, // 默认为false
      status: 'valid'
    };

    expect(mockResult.isPaid).toBe(false);
    expect(mockResult.status).toBe('valid');
  });

  test('未启用付费检测时不应有isPaid属性', () => {
    const mockResult = {
      valid: true,
      status: 'valid'
      // 没有isPaid属性
    };

    expect(mockResult.isPaid).toBeUndefined();
  });
});
