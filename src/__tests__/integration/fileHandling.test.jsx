import { vi } from 'vitest';
/**
 * 文件处理功能测试 (非UI组件测试)
 */

import { showToast } from '../../utils/toast.jsx';

// Mock toast
vi.mock('../../utils/toast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Store original globals for restoration
const REALS = {
  document: global.document,
  FileReader: global.FileReader,
  URL_createObjectURL: global.URL?.createObjectURL,
  URL_revokeObjectURL: global.URL?.revokeObjectURL,
};

// Mock file reader
class MockFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file) {
    setTimeout(() => {
      if (this.error) {
        this.onerror && this.onerror({ target: { error: this.error } });
      } else {
        this.onload && this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

global.FileReader = MockFileReader;

// Simple utility functions for testing (extracted from existing codebase logic)
const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
    return { valid: false, error: '请选择文本文件(.txt)' };
  }
  
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '文件大小不能超过10MB' };
  }
  
  return { valid: true };
};

const readFileAsync = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e.target.error);
    reader.readAsText(file);
  });
};

const exportData = (data, filename = 'export.txt') => {
  if (!data || data.length === 0) {
    showToast.warning('没有数据可导出');
    return false;
  }

  try {
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast.success('导出成功');
    return true;
  } catch (error) {
    showToast.error('导出失败: ' + error.message);
    return false;
  }
};

describe('File Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock DOM methods
    global.document = {
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore globals
    global.document = REALS.document;
    global.FileReader = REALS.FileReader;
    if (global.URL) {
      global.URL.createObjectURL = REALS.URL_createObjectURL;
      global.URL.revokeObjectURL = REALS.URL_revokeObjectURL;
    }
  });

  describe('File Validation', () => {
    test('should validate text files successfully', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    test('should reject non-text files', () => {
      const file = new File(['binary'], 'test.exe', { type: 'application/exe' });
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('请选择文本文件(.txt)');
    });

    test('should reject files larger than 10MB', () => {
      const file = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('文件大小不能超过10MB');
    });

    test('should reject null/undefined files', () => {
      expect(validateFile(null).valid).toBe(false);
      expect(validateFile(undefined).valid).toBe(false);
    });

    test('should accept .txt files by extension', () => {
      const file = new File(['content'], 'test.txt', { type: '' });
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('File Reading', () => {
    test('should read file content successfully', async () => {
      const content = 'sk-test123\nsk-test456';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      
      // Create a fresh mock for this test
      const mockReader = new MockFileReader();
      mockReader.result = content;
      mockReader.error = null;
      
      global.FileReader = vi.fn(() => mockReader);
      
      const promise = readFileAsync(file);
      vi.advanceTimersByTime(10);
      
      const result = await promise;
      expect(result).toBe(content);
    });

    test('should handle file read errors', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const error = new Error('Read failed');
      
      // Create a fresh mock for this test
      const mockReader = new MockFileReader();
      mockReader.error = error;
      mockReader.result = null;
      
      global.FileReader = vi.fn(() => mockReader);
      
      const promise = readFileAsync(file);
      vi.advanceTimersByTime(10);
      
      await expect(promise).rejects.toBe(error);
    });
  });

  describe('File Export', () => {
    test('should export data successfully', () => {
      const data = 'sk-test123\nsk-test456';
      const result = exportData(data, 'keys.txt');
      
      expect(result).toBe(true);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(showToast.success).toHaveBeenCalledWith('导出成功');
    });

    test('should handle empty data', () => {
      const result = exportData('');
      
      expect(result).toBe(false);
      expect(showToast.warning).toHaveBeenCalledWith('没有数据可导出');
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    test('should handle null data', () => {
      const result = exportData(null);
      
      expect(result).toBe(false);
      expect(showToast.warning).toHaveBeenCalledWith('没有数据可导出');
    });

    test('should handle export errors', () => {
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob creation failed');
      });
      
      const result = exportData('test data');
      
      expect(result).toBe(false);
      expect(showToast.error).toHaveBeenCalledWith('导出失败: Blob creation failed');
    });

    test('should use default filename', () => {
      const result = exportData('test data');
      
      expect(result).toBe(true);
      expect(showToast.success).toHaveBeenCalledWith('导出成功');
    });
  });

  describe('Complete File Workflow', () => {
    test('should handle complete import-process-export cycle', async () => {
      const originalData = 'sk-test123\nsk-test456\nsk-test789';
      const file = new File([originalData], 'input.txt', { type: 'text/plain' });
      
      // Step 1: Validate
      const validation = validateFile(file);
      expect(validation.valid).toBe(true);
      
      // Step 2: Read
      const mockReader = new MockFileReader();
      mockReader.result = originalData;
      mockReader.error = null;
      global.FileReader = vi.fn(() => mockReader);
      
      const promise = readFileAsync(file);
      vi.advanceTimersByTime(10);
      const content = await promise;
      
      expect(content).toBe(originalData);
      
      // Step 3: Process (simple transformation)
      const processedData = content.split('\n').map(line => line.trim()).join('\n');
      
      // Step 4: Export
      const result = exportData(processedData, 'output.txt');
      expect(result).toBe(true);
      expect(showToast.success).toHaveBeenCalledWith('导出成功');
    });
  });
});