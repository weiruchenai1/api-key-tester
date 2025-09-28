/**
 * useVirtualization Hook 测试
 */

import { renderHook } from '@testing-library/react';
import { useVirtualization } from '../../hooks/useVirtualization';

describe('useVirtualization Hook', () => {
  test('should initialize with correct functions', () => {
    const { result } = renderHook(() => useVirtualization());

    expect(typeof result.current.getItemHeight).toBe('function');
    expect(typeof result.current.getListHeight).toBe('function');
  });

  test('should return fixed list height', () => {
    const { result } = renderHook(() => useVirtualization());

    const listHeight = result.current.getListHeight();
    expect(listHeight).toBe(350);
  });

  describe('getItemHeight', () => {
    let getItemHeight;

    beforeEach(() => {
      const { result } = renderHook(() => useVirtualization());
      getItemHeight = result.current.getItemHeight;
    });

    test('should return default height for null keyData', () => {
      const height = getItemHeight(null);
      expect(height).toBe(60);
    });

    test('should return default height for undefined keyData', () => {
      const height = getItemHeight(undefined);
      expect(height).toBe(60);
    });

    test('should return base height for minimal keyData', () => {
      const keyData = { key: 'sk-test' };
      const height = getItemHeight(keyData);
      expect(height).toBe(68); // Math.max(60, 68)
    });

    test('should calculate height for short keys', () => {
      const keyData = { key: 'sk-short-key' };
      const height = getItemHeight(keyData);
      expect(height).toBe(68);
    });

    test('should add extra height for long keys', () => {
      const longKey = 'sk-' + 'x'.repeat(100); // 103 characters
      const keyData = { key: longKey };
      const height = getItemHeight(keyData);
      
      // Should add extra lines for long key
      // (103 - 60) / 60 = 0.71, ceil = 1 extra line
      // 60 + (1 * 18) = 78
      expect(height).toBe(78);
    });

    test('should add height for model information', () => {
      const keyData = { 
        key: 'sk-test',
        model: 'gpt-4'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(76); // 60 + 16 for model
    });

    test('should add height for short error messages', () => {
      const keyData = { 
        key: 'sk-test',
        error: 'Invalid key'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(76); // 60 + 16 for error
    });

    test('should add double height for long error messages', () => {
      const keyData = { 
        key: 'sk-test',
        error: 'This is a very long error message that exceeds fifty characters'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(92); // 60 + (16 * 2) for long error
    });

    test('should add height for retry information', () => {
      const keyData = { 
        key: 'sk-test',
        retryCount: 2
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(76); // 60 + 16 for retry info
    });

    test('should add height for valid status', () => {
      const keyData = { 
        key: 'sk-test',
        status: 'valid'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(76); // 60 + 16 for status
    });

    test('should add height for paid status', () => {
      const keyData = { 
        key: 'sk-test',
        status: 'paid'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(76); // 60 + 16 for status
    });

    test('should add extra height for siliconcloud with valid status', () => {
      const keyData = { 
        key: 'sk-test',
        status: 'valid'
      };
      const height = getItemHeight(keyData, 'siliconcloud');
      expect(height).toBe(92); // 60 + 16 (status) + 16 (balance)
    });

    test('should add extra height for siliconcloud with paid status', () => {
      const keyData = { 
        key: 'sk-test',
        status: 'paid'
      };
      const height = getItemHeight(keyData, 'siliconcloud');
      expect(height).toBe(92); // 60 + 16 (status) + 16 (balance)
    });

    test('should not add extra height for siliconcloud with invalid status', () => {
      const keyData = { 
        key: 'sk-test',
        status: 'invalid'
      };
      const height = getItemHeight(keyData, 'siliconcloud');
      expect(height).toBe(68); // base height only
    });

    test('should calculate height for complex keyData', () => {
      const keyData = {
        key: 'sk-' + 'x'.repeat(70), // 73 characters, should add 1 extra line
        model: 'gpt-4',
        error: 'This is a long error message that should take two lines',
        retryCount: 3,
        status: 'valid'
      };
      const height = getItemHeight(keyData, 'openai');
      
      // 60 (base) + 18 (long key) + 16 (model) + 32 (long error) + 16 (retry) + 16 (status) = 158
      expect(height).toBe(158);
    });

    test('should calculate height for siliconcloud with all features', () => {
      const keyData = {
        key: 'sk-test',
        model: 'Qwen2-72B',
        error: 'Short error',
        retryCount: 1,
        status: 'valid'
      };
      const height = getItemHeight(keyData, 'siliconcloud');
      
      // 60 (base) + 16 (model) + 16 (error) + 16 (retry) + 16 (status) + 16 (balance) = 140
      expect(height).toBe(140);
    });

    test('should enforce minimum height', () => {
      const keyData = { key: '' }; // Very minimal data
      const height = getItemHeight(keyData);
      expect(height).toBeGreaterThanOrEqual(68);
    });

    test('should handle missing key property', () => {
      const keyData = { 
        model: 'gpt-4',
        status: 'valid'
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(92); // 60 + 16 (model) + 16 (status)
    });

    test('should handle zero retry count', () => {
      const keyData = { 
        key: 'sk-test',
        retryCount: 0
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(68); // Should not add height for 0 retries
    });

    test('should handle empty strings', () => {
      const keyData = { 
        key: '',
        model: '',
        error: ''
      };
      const height = getItemHeight(keyData);
      expect(height).toBe(68); // Should not add height for empty strings
    });

    test('should be stable across multiple calls', () => {
      const keyData = { 
        key: 'sk-test',
        model: 'gpt-4',
        status: 'valid'
      };
      
      const height1 = getItemHeight(keyData, 'openai');
      const height2 = getItemHeight(keyData, 'openai');
      const height3 = getItemHeight(keyData, 'openai');
      
      expect(height1).toBe(height2);
      expect(height2).toBe(height3);
      expect(height1).toBe(92); // 60 + 16 (model) + 16 (status)
    });
  });
});