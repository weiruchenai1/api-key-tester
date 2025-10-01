import { vi } from 'vitest';
/**
 * 文件处理功能测试 (非UI组件测试)
 */

import { showToast } from '../../utils/toast.jsx';
import {
  validateFileType,
  readFileAsText,
  downloadFile,
  exportResultsAsJson
} from '../../utils/fileHandler.js';

// Mock toast
vi.mock('../../utils/toast.jsx', () => ({
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
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });

    test('should reject non-text files', () => {
      const file = new File(['binary'], 'test.exe', { type: 'application/exe' });
      const result = validateFileType(file);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_type');
    });

    test('should reject files larger than 10MB', () => {
      const file = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('too_large');
    });

    test('should reject null/undefined files', () => {
      expect(validateFileType(null).valid).toBe(false);
      expect(validateFileType(null).reason).toBe('no_file');
      expect(validateFileType(undefined).valid).toBe(false);
      expect(validateFileType(undefined).reason).toBe('no_file');
    });

    test('should accept .txt files by extension', () => {
      const file = new File(['content'], 'test.txt', { type: '' });
      const result = validateFileType(file);
      
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
      
      const promise = readFileAsText(file);
      vi.advanceTimersByTime(10);
      
      const result = await promise;
      expect(result).toBe(content);
    });

    test('should handle file read errors', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const error = new Error('文件读取失败');
      
      // Create a fresh mock for this test
      const mockReader = new MockFileReader();
      mockReader.error = error;
      mockReader.result = null;
      
      global.FileReader = vi.fn(() => mockReader);
      
      const promise = readFileAsText(file);
      vi.advanceTimersByTime(10);
      
      await expect(promise).rejects.toThrow('文件读取失败');
    });
  });

  describe('File Export', () => {
    test('should create blob for JSON export successfully', () => {
      const keyResults = [
        { key: 'sk-test123', status: 'valid' },
        { key: 'sk-test456', status: 'invalid' }
      ];
      const summary = { total: 2, valid: 1, invalid: 1 };
      
      const blob = exportResultsAsJson(keyResults, summary);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    test('should download file successfully', () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      
      downloadFile(blob, 'test.txt');
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(global.document.body.appendChild).toHaveBeenCalled();
      expect(global.document.body.removeChild).toHaveBeenCalled();
    });

    test('should handle download errors', () => {
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob creation failed');
      });
      
      const blob = new Blob(['test data'], { type: 'text/plain' });
      
      expect(() => downloadFile(blob, 'test.txt')).toThrow('Blob creation failed');
    });
  });

  describe('Complete File Workflow', () => {
    test('should handle complete import-process-export cycle', async () => {
      const originalData = 'sk-test123\nsk-test456\nsk-test789';
      const file = new File([originalData], 'input.txt', { type: 'text/plain' });
      
      // Step 1: Validate
      const validation = validateFileType(file);
      expect(validation.valid).toBe(true);
      
      // Step 2: Read
      const mockReader = new MockFileReader();
      mockReader.result = originalData;
      mockReader.error = null;
      global.FileReader = vi.fn(() => mockReader);
      
      const promise = readFileAsText(file);
      vi.advanceTimersByTime(10);
      const content = await promise;
      
      expect(content).toBe(originalData);
      
      // Step 3: Process and export - create JSON export
      const keyResults = content.split('\n').map(key => ({ key: key.trim(), status: 'pending' }));
      const summary = { total: keyResults.length, valid: 0, invalid: 0, pending: keyResults.length };
      
      // Step 4: Export
      const blob = exportResultsAsJson(keyResults, summary);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      
      // Step 5: Download
      downloadFile(blob, 'results.json');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(global.document.createElement).toHaveBeenCalledWith('a');
    });
  });
});