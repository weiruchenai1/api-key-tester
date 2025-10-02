import { vi } from 'vitest';
/**
 * usePaidDetectionPrompt Hook 测试
 */

import { renderHook, act } from '@testing-library/react';
import { usePaidDetectionPrompt } from '../../hooks/usePaidDetectionPrompt';
import { PAID_DETECTION_KEYS } from '../../constants/localStorage';

// Mock AppStateContext
const mockDispatch = vi.fn();
vi.mock('../../contexts/AppStateContext', () => ({
  useAppState: () => ({
    dispatch: mockDispatch
  })
}));

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete mockLocalStorage.store[key];
  })
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('usePaidDetectionPrompt Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.store = {};
    mockLocalStorage.getItem.mockImplementation(
      (key) => mockLocalStorage.store[key] || null
    );
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => usePaidDetectionPrompt());

    expect(result.current.showPaidDetectionPrompt).toBe(false);
    expect(typeof result.current.showPrompt).toBe('function');
    expect(typeof result.current.hidePrompt).toBe('function');
    expect(typeof result.current.handleConfirm).toBe('function');
    expect(typeof result.current.checkPaidDetectionPrompt).toBe('function');
    expect(typeof result.current.handleApiTypeChange).toBe('function');
  });

  describe('checkPaidDetectionPrompt', () => {
    test('should return false for non-gemini API types', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(result.current.checkPaidDetectionPrompt('openai')).toBe(false);
      expect(result.current.checkPaidDetectionPrompt('claude')).toBe(false);
      expect(result.current.checkPaidDetectionPrompt('deepseek')).toBe(false);
    });

    test('should return true for gemini when prompt not disabled', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(result.current.checkPaidDetectionPrompt('gemini')).toBe(true);
    });

    test('should return false when prompt is disabled', () => {
      mockLocalStorage.store[PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED] = 'true';
      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(result.current.checkPaidDetectionPrompt('gemini')).toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_PAID_DETECTION', 
        payload: false 
      });
    });

    test('should use default setting when prompt is disabled', () => {
      mockLocalStorage.store[PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED] = 'true';
      mockLocalStorage.store[PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING] = 'true';
      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(result.current.checkPaidDetectionPrompt('gemini')).toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_PAID_DETECTION', 
        payload: true 
      });
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(result.current.checkPaidDetectionPrompt('gemini')).toBe(true);
      // Should not throw error
    });
  });

  describe('showPrompt and hidePrompt', () => {
    test('should show prompt', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.showPrompt();
      });

      expect(result.current.showPaidDetectionPrompt).toBe(true);
    });

    test('should hide prompt', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.showPrompt();
      });
      expect(result.current.showPaidDetectionPrompt).toBe(true);

      act(() => {
        result.current.hidePrompt();
      });
      expect(result.current.showPaidDetectionPrompt).toBe(false);
    });
  });

  describe('handleConfirm', () => {
    test('should dispatch SET_PAID_DETECTION and hide prompt', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.showPrompt();
      });
      expect(result.current.showPaidDetectionPrompt).toBe(true);

      act(() => {
        result.current.handleConfirm(true);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_PAID_DETECTION', 
        payload: true 
      });
      expect(result.current.showPaidDetectionPrompt).toBe(false);
    });

    test('should handle false confirmation', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.handleConfirm(false);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_PAID_DETECTION', 
        payload: false 
      });
    });
  });

  describe('handleApiTypeChange', () => {
    test('should call onApiTypeChange callback when provided', () => {
      const mockCallback = vi.fn();
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.handleApiTypeChange('openai', mockCallback);
      });

      expect(mockCallback).toHaveBeenCalledWith('openai');
    });

    test('should not throw when no callback provided', () => {
      const { result } = renderHook(() => usePaidDetectionPrompt());

      expect(() => {
        act(() => {
          result.current.handleApiTypeChange('openai');
        });
      }).not.toThrow();
    });

    test('should show prompt for gemini API type', () => {
      const mockCallback = vi.fn();
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.handleApiTypeChange('gemini', mockCallback);
      });

      expect(mockCallback).toHaveBeenCalledWith('gemini');
      expect(result.current.showPaidDetectionPrompt).toBe(true);
    });

    test('should not show prompt for non-gemini API types', () => {
      const mockCallback = vi.fn();
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.handleApiTypeChange('openai', mockCallback);
      });

      expect(result.current.showPaidDetectionPrompt).toBe(false);
    });

    test('should not show prompt when gemini prompt is disabled', () => {
      mockLocalStorage.store[PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED] = 'true';
      const mockCallback = vi.fn();
      const { result } = renderHook(() => usePaidDetectionPrompt());

      act(() => {
        result.current.handleApiTypeChange('gemini', mockCallback);
      });

      expect(result.current.showPaidDetectionPrompt).toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith({ 
        type: 'SET_PAID_DETECTION', 
        payload: false 
      });
    });
  });

  test('should maintain function stability between renders', () => {
    const { result, rerender } = renderHook(() => usePaidDetectionPrompt());

    const functions1 = {
      showPrompt: result.current.showPrompt,
      hidePrompt: result.current.hidePrompt,
      handleConfirm: result.current.handleConfirm,
      checkPaidDetectionPrompt: result.current.checkPaidDetectionPrompt,
      handleApiTypeChange: result.current.handleApiTypeChange
    };

    rerender();

    const functions2 = {
      showPrompt: result.current.showPrompt,
      hidePrompt: result.current.hidePrompt,
      handleConfirm: result.current.handleConfirm,
      checkPaidDetectionPrompt: result.current.checkPaidDetectionPrompt,
      handleApiTypeChange: result.current.handleApiTypeChange
    };

    // Functions should be stable (same reference)
    expect(functions1.showPrompt).toBe(functions2.showPrompt);
    expect(functions1.hidePrompt).toBe(functions2.hidePrompt);
    expect(functions1.handleConfirm).toBe(functions2.handleConfirm);
    expect(functions1.checkPaidDetectionPrompt).toBe(functions2.checkPaidDetectionPrompt);
    expect(functions1.handleApiTypeChange).toBe(functions2.handleApiTypeChange);
  });
});