/**
 * useLocalStorage Hook 测试
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useUserConfig } from '../../hooks/useLocalStorage';

// Mock window.localStorage
const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn()
  },
  writable: true
});

// Mock URL and document for blob handling
global.URL = {
  createObjectURL: jest.fn(() => 'blob:url'),
  revokeObjectURL: jest.fn()
};

// Mock FileReader
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  onload: null,
  onerror: null
}));

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.store = {};
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    const [value] = result.current;
    expect(value).toBe('defaultValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  test('should initialize with stored value when exists', () => {
    // Set value before creating the hook
    mockLocalStorage.setItem('testKey', JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    const [value] = result.current;
    expect(value).toBe('storedValue');
  });

  test('should handle JSON parse errors gracefully', () => {
    // Set invalid JSON directly to store to bypass the mock's JSON.stringify
    mockLocalStorage.store['testKey'] = 'invalid json {';

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    const [value] = result.current;
    expect(value).toBe('defaultValue');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('读取localStorage失败'),
      expect.any(Error)
    );
  });

  test('should update value and save to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    const [value] = result.current;
    expect(value).toBe('newValue');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));
  });

  test('should handle function values like useState', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue(prev => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(1));
  });

  test('should remove item when value is undefined', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue(undefined);
    });

    const [value] = result.current;
    expect(value).toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
  });

  test('should handle localStorage setItem errors', () => {
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('保存到localStorage失败'),
      expect.any(Error)
    );
  });

  test('should handle complex object values', () => {
    const complexObject = { foo: 'bar', nested: { value: 123 } };
    const { result } = renderHook(() => useLocalStorage('testKey', null));

    act(() => {
      const [, setValue] = result.current;
      setValue(complexObject);
    });

    const [value] = result.current;
    expect(value).toEqual(complexObject);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(complexObject));
  });
});

describe('useUserConfig Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.store = {};
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock document methods
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: ''
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useUserConfig());

    expect(result.current.apiType).toBe('openai');
    expect(result.current.proxyUrl).toBe('');
    expect(result.current.testModel).toBe('gpt-4o');
    expect(result.current.theme).toBe('system');
    expect(result.current.language).toBe('zh');
    expect(result.current.concurrency).toBe(3);
    expect(result.current.maxRetries).toBe(2);
    expect(result.current.retryDelay).toBe(1000);
    expect(result.current.enablePaidDetection).toBe(false);
    expect(result.current.recentProxyUrls).toEqual([]);
  });

  test('should update API configuration', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.setApiType('claude');
      result.current.setProxyUrl('https://proxy.example.com');
      result.current.setTestModel('claude-3-sonnet');
    });

    expect(result.current.apiType).toBe('claude');
    expect(result.current.proxyUrl).toBe('https://proxy.example.com');
    expect(result.current.testModel).toBe('claude-3-sonnet');
  });

  test('should add recent proxy URLs correctly', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.addRecentProxyUrl('https://proxy1.com');
      result.current.addRecentProxyUrl('https://proxy2.com');
    });

    expect(result.current.recentProxyUrls).toEqual([
      'https://proxy2.com',
      'https://proxy1.com'
    ]);
  });

  test('should not add empty or duplicate proxy URLs', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.addRecentProxyUrl('https://proxy1.com');
      result.current.addRecentProxyUrl('');
      result.current.addRecentProxyUrl('   ');
      result.current.addRecentProxyUrl('https://proxy1.com'); // duplicate
    });

    expect(result.current.recentProxyUrls).toEqual(['https://proxy1.com']);
  });

  test('should limit recent proxy URLs to 10 items', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      for (let i = 1; i <= 15; i++) {
        result.current.addRecentProxyUrl(`https://proxy${i}.com`);
      }
    });

    expect(result.current.recentProxyUrls).toHaveLength(10);
    expect(result.current.recentProxyUrls[0]).toBe('https://proxy15.com');
    expect(result.current.recentProxyUrls[9]).toBe('https://proxy6.com');
  });

  test('should clear all configuration', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.clearAllConfig();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(12);
    expect(window.location.reload).toHaveBeenCalled();
  });

  test('should handle localStorage errors when clearing config', () => {
    mockLocalStorage.removeItem.mockImplementationOnce((key) => {
      if (key === 'apiType') {
        throw new Error('Remove failed');
      }
    });

    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.clearAllConfig();
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('清除配置失败'),
      expect.any(Error)
    );
  });

  test('should export configuration', () => {
    const { result } = renderHook(() => useUserConfig());

    act(() => {
      result.current.setApiType('claude');
      result.current.setTheme('dark');
    });

    act(() => {
      result.current.exportConfig();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('should import valid configuration successfully', async () => {
    const { result } = renderHook(() => useUserConfig());
    
    const mockFile = new File(['{}'], 'config.json');
    const mockConfig = {
      version: '1.0',
      apiType: 'claude',
      theme: 'dark',
      language: 'en',
      concurrency: 5
    };

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };
    global.FileReader.mockReturnValue(mockFileReader);

    const importPromise = result.current.importConfig(mockFile);

    // Simulate successful file read
    act(() => {
      mockFileReader.onload({ target: { result: JSON.stringify(mockConfig) } });
    });

    const resultMessage = await importPromise;

    expect(resultMessage).toBe('配置导入成功');
    expect(result.current.apiType).toBe('claude');
    expect(result.current.theme).toBe('dark');
    expect(result.current.language).toBe('en');
    expect(result.current.concurrency).toBe(5);
  });

  test('should handle invalid configuration file', async () => {
    const { result } = renderHook(() => useUserConfig());
    
    const mockFile = new File(['{}'], 'config.json');
    const invalidConfig = { noVersion: true };

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };
    global.FileReader.mockReturnValue(mockFileReader);

    const importPromise = result.current.importConfig(mockFile);

    // Simulate file read with invalid config
    act(() => {
      mockFileReader.onload({ target: { result: JSON.stringify(invalidConfig) } });
    });

    await expect(importPromise).rejects.toContain('配置文件格式错误');
  });

  test('should handle file read errors', async () => {
    const { result } = renderHook(() => useUserConfig());
    
    const mockFile = new File(['{}'], 'config.json');

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };
    global.FileReader.mockReturnValue(mockFileReader);

    const importPromise = result.current.importConfig(mockFile);

    // Simulate file read error
    act(() => {
      mockFileReader.onerror();
    });

    await expect(importPromise).rejects.toBe('文件读取失败');
  });

  test('should handle JSON parse errors during import', async () => {
    const { result } = renderHook(() => useUserConfig());
    
    const mockFile = new File(['{}'], 'config.json');

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };
    global.FileReader.mockReturnValue(mockFileReader);

    const importPromise = result.current.importConfig(mockFile);

    // Simulate file read with invalid JSON
    act(() => {
      mockFileReader.onload({ target: { result: 'invalid json {' } });
    });

    await expect(importPromise).rejects.toContain('配置文件格式错误');
  });
});