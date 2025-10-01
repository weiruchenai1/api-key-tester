import { vi } from 'vitest';
/**
 * Toast 工具函数测试
 */

import toast from 'react-hot-toast';
import { showToast, showConfirm, showAlert, showConfirmDialog } from '../../utils/toast.jsx';
import { render, fireEvent } from '@testing-library/react';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn((component, options) => {
    // Mock the toast function to call the component if it's a function
    if (typeof component === 'function') {
      const mockToastObject = { id: 'mock-toast-id' };
      component(mockToastObject);
    }
    return 'mock-toast-id';
  });

  // Add methods to the mock function
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.loading = vi.fn(() => 'mock-loading-id');
  mockToast.dismiss = vi.fn();

  return {
    __esModule: true,
    default: mockToast
  };
});

describe('Toast Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showToast', () => {
    test('should call toast.success for success', () => {
      showToast.success('Success message');
      expect(toast.success).toHaveBeenCalledWith('Success message');
    });

    test('should call toast.error for error', () => {
      showToast.error('Error message');
      expect(toast.error).toHaveBeenCalledWith('Error message');
    });

    test('should call toast with info styling for info', () => {
      showToast.info('Info message');
      expect(toast).toHaveBeenCalledWith('Info message', {
        icon: "ℹ️",
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderLeftColor: "var(--color-info)",
          borderLeftWidth: "4px",
        },
        ariaProps: {
          role: "status",
          "aria-live": "polite",
          "aria-label": "信息通知: Info message"
        },
      });
    });

    test('should call toast with warning styling for warning', () => {
      showToast.warning('Warning message');
      expect(toast).toHaveBeenCalledWith('Warning message', {
        icon: "⚠️",
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)", 
          border: "1px solid var(--border-color)",
          borderLeftColor: "var(--color-warning)",
          borderLeftWidth: "4px",
        },
        ariaProps: {
          role: "alert",
          "aria-live": "assertive",
          "aria-label": "警告通知: Warning message"
        },
      });
    });

    test('should call toast.loading for loading', () => {
      // Mock the return value before calling the function
      toast.loading.mockReturnValue('mock-loading-id');
      
      const result = showToast.loading('Loading message');
      expect(toast.loading).toHaveBeenCalledWith('Loading message');
      expect(result).toBe('mock-loading-id');
    });

    test('should call toast.dismiss for dismiss', () => {
      showToast.dismiss('toast-id');
      expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    });
  });

  describe('showConfirm', () => {
    test('should create confirm dialog with default options', () => {
      const promise = showConfirm('Are you sure?');
      
      expect(toast).toHaveBeenCalledWith(
        expect.any(Function),
        {
          duration: Infinity,
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--border-radius)",
            padding: "16px",
            boxShadow: "var(--shadow-sm)",
          },
          ariaProps: {
            role: "alertdialog",
            "aria-modal": "true",
            "aria-label": "确认对话框"
          },
        }
      );

      expect(promise).toBeInstanceOf(Promise);
    });

    test('should create confirm dialog with custom options', () => {
      const options = {
        confirmText: 'Yes',
        cancelText: 'No',
        confirmStyle: 'primary'
      };

      showConfirm('Custom confirm?', options);
      expect(toast).toHaveBeenCalled();
    });

    test('should resolve true when confirm button is clicked', async () => {
      let resolveValue;
      const promise = showConfirm('Test confirm').then(value => {
        resolveValue = value;
      });

      // Get the component function that was passed to toast
      const componentFunction = toast.mock.calls[0][0];
      const mockToastObj = { id: 'test-id' };
      
      // Render the component
      const component = componentFunction(mockToastObj);
      const { container } = render(component);
      
      // Find and click the confirm button (second button)
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[1]); // Confirm button

      await promise;
      expect(resolveValue).toBe(true);
      expect(toast.dismiss).toHaveBeenCalledWith('test-id');
    });

    test('should resolve false when cancel button is clicked', async () => {
      let resolveValue;
      const promise = showConfirm('Test confirm').then(value => {
        resolveValue = value;
      });

      // Get the component function that was passed to toast
      const componentFunction = toast.mock.calls[0][0];
      const mockToastObj = { id: 'test-id' };
      
      // Render the component
      const component = componentFunction(mockToastObj);
      const { container } = render(component);
      
      // Find and click the cancel button (first button)
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[0]); // Cancel button

      await promise;
      expect(resolveValue).toBe(false);
      expect(toast.dismiss).toHaveBeenCalledWith('test-id');
    });

    test('should render custom button texts', () => {
      const options = {
        confirmText: 'Accept',
        cancelText: 'Decline'
      };

      showConfirm('Custom buttons?', options);

      const componentFunction = toast.mock.calls[0][0];
      const mockToastObj = { id: 'test-id' };
      const component = componentFunction(mockToastObj);
      const { container } = render(component);

      expect(container.textContent).toContain('Accept');
      expect(container.textContent).toContain('Decline');
    });

    test('should apply correct button styles', () => {
      showConfirm('Style test?');

      const componentFunction = toast.mock.calls[0][0];
      const mockToastObj = { id: 'test-id' };
      const component = componentFunction(mockToastObj);
      const { container } = render(component);

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      
      // Verify buttons have style attributes
      expect(buttons[0].getAttribute('style')).toBeTruthy();
      expect(buttons[1].getAttribute('style')).toBeTruthy();
    });

    test('should handle button interactions', () => {
      showConfirm('Interaction test?');

      const componentFunction = toast.mock.calls[0][0];
      const mockToastObj = { id: 'test-id' };
      const component = componentFunction(mockToastObj);
      const { container } = render(component);

      const cancelButton = container.querySelectorAll('button')[0];
      
      // Test that hover events don't throw errors
      expect(() => {
        fireEvent.mouseOver(cancelButton);
        fireEvent.mouseOut(cancelButton);
      }).not.toThrow();
    });
  });

  describe('showAlert function', () => {
    test('should call showToast.info', () => {
      const spy = vi.spyOn(showToast, 'info');
      showAlert('Alert message');
      expect(spy).toHaveBeenCalledWith('Alert message');
      spy.mockRestore();
    });
  });

  describe('showConfirmDialog function', () => {
    test('should call showConfirm', () => {
      const result = showConfirmDialog('Confirm message');
      expect(result).toBeInstanceOf(Promise);
      expect(toast).toHaveBeenCalled();
    });
  });
});