/**
 * useFileHandler Hook 测试
 */

import { renderHook, act } from '@testing-library/react';
import { useFileHandler } from '../../hooks/useFileHandler';

// Mock dependencies
const mockDispatch = jest.fn();
const mockT = jest.fn((key, params) => {
  const translations = {
    selectTextFile: '请选择文本文件(.txt)',
    fileTooLarge: '文件大小不能超过10MB',
    importSuccess: `导入成功，共发现 ${params?.count || 0} 个密钥`,
    noValidKeysFound: '未找到有效的API密钥',
    importFailed: '文件导入失败'
  };
  return translations[key] || key;
});

jest.mock('../../contexts/AppStateContext', () => ({
  useAppState: () => ({
    state: { apiKeysText: '' },
    dispatch: mockDispatch
  })
}));

jest.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: mockT })
}));

jest.mock('../../utils/fileHandler', () => ({
  extractApiKeys: jest.fn()
}));

const { extractApiKeys } = require('../../utils/fileHandler');

// Mock FileReader
class MockFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file, encoding) {
    setTimeout(() => {
      if (this.error) {
        this.onerror && this.onerror();
      } else {
        this.onload && this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader;

describe('useFileHandler Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useFileHandler());

    expect(result.current.isImporting).toBe(false);
    expect(typeof result.current.importFile).toBe('function');
  });

  test('should reject non-text files', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'error',
        message: '请选择文本文件(.txt)'
      }
    });
  });

  test('should accept .txt files', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['sk-test123'], 'test.txt', { type: 'text/plain' });
    extractApiKeys.mockReturnValue(['sk-test123']);

    MockFileReader.prototype.result = 'sk-test123';
    MockFileReader.prototype.error = null;

    await act(async () => {
      await result.current.importFile(file);
    });

    // Should not show error for valid text file
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          type: 'error',
          message: '请选择文本文件(.txt)'
        })
      })
    );
  });

  test('should accept files with empty type but .txt extension', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['sk-test123'], 'test.txt', { type: '' });
    extractApiKeys.mockReturnValue(['sk-test123']);

    MockFileReader.prototype.result = 'sk-test123';
    MockFileReader.prototype.error = null;

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          type: 'error',
          message: '请选择文本文件(.txt)'
        })
      })
    );
  });

  test('should reject files larger than 10MB', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'error',
        message: '文件大小不能超过10MB'
      }
    });
  });

  test('should handle null file gracefully', async () => {
    const { result } = renderHook(() => useFileHandler());

    await act(async () => {
      await result.current.importFile(null);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('should import file successfully with API keys', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['sk-test123\nsk-test456'], 'keys.txt', { type: 'text/plain' });
    const extractedKeys = ['sk-test123', 'sk-test456'];
    
    extractApiKeys.mockReturnValue(extractedKeys);
    MockFileReader.prototype.result = 'sk-test123\nsk-test456';
    MockFileReader.prototype.error = null;

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(result.current.isImporting).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_API_KEYS_TEXT',
      payload: 'sk-test123\nsk-test456'
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'success',
        message: '导入成功，共发现 2 个密钥'
      }
    });
  });

  test('should append to existing API keys', async () => {
    jest.resetModules();
    
    // Isolate modules to allow fresh mock
    await jest.isolateModules(async () => {
      // Mock state with existing keys
      jest.doMock('../../contexts/AppStateContext', () => ({
        useAppState: () => ({
          state: { apiKeysText: 'existing-key' },
          dispatch: mockDispatch
        })
      }));
      
      const { useFileHandler: isolatedUseFileHandler } = require('../../hooks/useFileHandler');
      const { renderHook } = require('@testing-library/react');
      const { act } = require('@testing-library/react');
      
      const { result } = renderHook(() => isolatedUseFileHandler());
      
      const file = new File(['sk-new123'], 'keys.txt', { type: 'text/plain' });
      extractApiKeys.mockReturnValue(['sk-new123']);
      MockFileReader.prototype.result = 'sk-new123';

      await act(async () => {
        await result.current.importFile(file);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_API_KEYS_TEXT',
        payload: 'existing-key\nsk-new123'
      });
    });
  });

  test('should handle empty API keys extraction', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['no keys here'], 'empty.txt', { type: 'text/plain' });
    extractApiKeys.mockReturnValue([]);
    MockFileReader.prototype.result = 'no keys here';

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'warning',
        message: '未找到有效的API密钥'
      }
    });
  });

  test('should handle file reading errors', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    MockFileReader.prototype.error = new Error('Read failed');

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(result.current.isImporting).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'error',
        message: '文件导入失败'
      }
    });
    expect(console.error).toHaveBeenCalledWith('文件导入失败:', expect.any(Error));
  });

  test('should handle API key extraction errors', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    extractApiKeys.mockImplementation(() => {
      throw new Error('Extraction failed');
    });
    MockFileReader.prototype.result = 'content';
    MockFileReader.prototype.error = null;

    await act(async () => {
      await result.current.importFile(file);
    });

    expect(result.current.isImporting).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_MESSAGE',
      payload: {
        type: 'error',
        message: '文件导入失败'
      }
    });
  });

  test('should set importing state during file processing', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['sk-test123'], 'test.txt', { type: 'text/plain' });
    extractApiKeys.mockReturnValue(['sk-test123']);
    MockFileReader.prototype.result = 'sk-test123';

    let importingStateDuringProcessing;

    await act(async () => {
      const importPromise = result.current.importFile(file);
      importingStateDuringProcessing = result.current.isImporting;
      await importPromise;
    });

    expect(importingStateDuringProcessing).toBe(true);
    expect(result.current.isImporting).toBe(false);
  });

  test('should handle FileReader onload event correctly', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['sk-test123'], 'test.txt', { type: 'text/plain' });
    const fileContent = 'sk-test123\nsk-test456';
    
    extractApiKeys.mockReturnValue(['sk-test123', 'sk-test456']);

    // Mock FileReader with custom behavior
    const originalFileReader = global.FileReader;
    const mockReader = new MockFileReader();
    mockReader.result = fileContent;
    global.FileReader = jest.fn(() => mockReader);

    try {
      await act(async () => {
        await result.current.importFile(file);
      });

      expect(extractApiKeys).toHaveBeenCalledWith(fileContent);
    } finally {
      global.FileReader = originalFileReader;
    }
  });

  test('should handle different file name cases', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const files = [
      new File(['content'], 'TEST.TXT', { type: 'text/plain' }),
      new File(['content'], 'test.TXT', { type: 'text/plain' }),
      new File(['content'], 'Test.Txt', { type: 'text/plain' })
    ];

    for (const file of files) {
      extractApiKeys.mockReturnValue(['sk-test123']);
      MockFileReader.prototype.result = 'sk-test123';

      await act(async () => {
        await result.current.importFile(file);
      });

      // Should accept files with various case combinations
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'error',
            message: '请选择文本文件(.txt)'
          })
        })
      );
    }
  });

  test('should handle exactly 10MB file size', async () => {
    const { result } = renderHook(() => useFileHandler());
    
    const file = new File(['x'.repeat(100)], 'exactly10mb.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });

    extractApiKeys.mockReturnValue(['sk-test123']);
    MockFileReader.prototype.result = 'sk-test123';

    await act(async () => {
      await result.current.importFile(file);
    });

    // Should accept exactly 10MB files
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          type: 'error',
          message: '文件大小不能超过10MB'
        })
      })
    );
  });
});