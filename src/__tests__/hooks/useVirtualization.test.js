/**
 * useVirtualization Hook 测试
 */

import { renderHook } from '@testing-library/react';
import { useVirtualization } from '../../hooks/useVirtualization';

describe('useVirtualization Hook', () => {
  // 保存原始的 window.matchMedia
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    // 恢复原始的 window.matchMedia
    window.matchMedia = originalMatchMedia;
  });

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
    test('should return desktop height (74px) for screens wider than 768px', () => {
      // 模拟桌面屏幕
      window.matchMedia = jest.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useVirtualization());
      const height = result.current.getItemHeight();

      expect(height).toBe(74); // 桌面端：72px + wrapper padding(2px)
    });

    test('should return mobile height (66px) for screens between 481px and 768px', () => {
      // 模拟移动端屏幕
      window.matchMedia = jest.fn((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useVirtualization());
      const height = result.current.getItemHeight();

      expect(height).toBe(66); // 移动端：64px + wrapper padding(2px)
    });

    test('should return extra-small height (62px) for screens 480px or smaller', () => {
      // 模拟超小屏幕
      window.matchMedia = jest.fn((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useVirtualization());
      const height = result.current.getItemHeight();

      expect(height).toBe(62); // 超小屏幕：60px + wrapper padding(2px)
    });

    test('should return consistent height across multiple calls', () => {
      // 模拟桌面屏幕
      window.matchMedia = jest.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useVirtualization());

      const height1 = result.current.getItemHeight();
      const height2 = result.current.getItemHeight();
      const height3 = result.current.getItemHeight();

      expect(height1).toBe(height2);
      expect(height2).toBe(height3);
      expect(height1).toBe(74);
    });

    test('should handle missing window.matchMedia gracefully', () => {
      // 移除 window.matchMedia
      window.matchMedia = undefined;

      const { result } = renderHook(() => useVirtualization());
      const height = result.current.getItemHeight();

      // 应该返回桌面端高度（默认值）
      expect(height).toBe(74);
    });

    test('should not accept any parameters', () => {
      // 模拟桌面屏幕
      window.matchMedia = jest.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useVirtualization());

      // 传递参数应该被忽略，高度只取决于屏幕宽度
      const heightWithoutParams = result.current.getItemHeight();
      const heightWithParams = result.current.getItemHeight({ key: 'sk-test' }, 'openai');

      expect(heightWithoutParams).toBe(heightWithParams);
      expect(heightWithoutParams).toBe(74);
    });
  });
});
