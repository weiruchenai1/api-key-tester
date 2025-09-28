/**
 * localStorage 服务测试
 */

import { storage, appStorage } from '../../services/storage/localStorage';

describe('Storage Service', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
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

    // Set up global localStorage before each test
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('storage.get', () => {
    test('should return parsed JSON value when key exists', () => {
      const testData = { name: 'test', value: 123 };
      mockLocalStorage.store['testKey'] = JSON.stringify(testData);

      const result = storage.get('testKey');
      expect(result).toEqual(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    test('should return default value when key does not exist', () => {
      const defaultValue = 'default';
      const result = storage.get('nonExistentKey', defaultValue);
      
      expect(result).toBe(defaultValue);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('nonExistentKey');
    });

    test('should return null as default when no default value provided', () => {
      const result = storage.get('nonExistentKey');
      expect(result).toBeNull();
    });

    test('should handle JSON parse errors gracefully', () => {
      mockLocalStorage.store['invalidJson'] = 'invalid json {';
      
      const result = storage.get('invalidJson', 'fallback');
      expect(result).toBe('fallback');
      expect(console.warn).toHaveBeenCalledWith('localStorage get error:', expect.any(Error));
    });

    test('should handle localStorage access errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = storage.get('testKey', 'fallback');
      expect(result).toBe('fallback');
      expect(console.warn).toHaveBeenCalledWith('localStorage get error:', expect.any(Error));
    });
  });

  describe('storage.set', () => {
    test('should stringify and store value successfully', () => {
      const testData = { name: 'test', value: 123 };
      const result = storage.set('testKey', testData);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));
    });

    test('should handle localStorage setItem errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = storage.set('testKey', 'testValue');
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('localStorage set error:', expect.any(Error));
    });

    test('should handle JSON stringify errors', () => {
      const circularObj = {};
      circularObj.self = circularObj;

      const result = storage.set('testKey', circularObj);
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('localStorage set error:', expect.any(Error));
    });
  });

  describe('storage.remove', () => {
    test('should remove item successfully', () => {
      mockLocalStorage.store['testKey'] = 'test value';
      
      const result = storage.remove('testKey');
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(mockLocalStorage.store['testKey']).toBeUndefined();
    });

    test('should handle removeItem errors', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const result = storage.remove('testKey');
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('localStorage remove error:', expect.any(Error));
    });
  });

  describe('storage.clear', () => {
    test('should clear all items successfully', () => {
      mockLocalStorage.store = { key1: 'value1', key2: 'value2' };
      
      const result = storage.clear();
      expect(result).toBe(true);
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockLocalStorage.store).toEqual({});
    });

    test('should handle clear errors', () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error('Clear failed');
      });

      const result = storage.clear();
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('localStorage clear error:', expect.any(Error));
    });
  });

  describe('storage.isSupported', () => {
    test('should return true when localStorage is available', () => {
      const result = storage.isSupported();
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('__localStorage_test__', 'test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__');
    });

    test('should return false when localStorage throws error', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Not supported');
      });

      const result = storage.isSupported();
      expect(result).toBe(false);
    });
  });
});

describe('App Storage Service', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
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

    global.localStorage = mockLocalStorage;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Theme Management', () => {
    test('should save theme successfully', () => {
      const result = appStorage.saveTheme('dark');
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', JSON.stringify('dark'));
    });

    test('should get saved theme', () => {
      mockLocalStorage.store['theme'] = JSON.stringify('dark');
      
      const result = appStorage.getTheme();
      expect(result).toBe('dark');
    });

    test('should return default theme when not set', () => {
      const result = appStorage.getTheme();
      expect(result).toBe('light');
    });
  });

  describe('Language Management', () => {
    test('should save language successfully', () => {
      const result = appStorage.saveLanguage('en');
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('language', JSON.stringify('en'));
    });

    test('should get saved language', () => {
      mockLocalStorage.store['language'] = JSON.stringify('en');
      
      const result = appStorage.getLanguage();
      expect(result).toBe('en');
    });

    test('should return default language when not set', () => {
      const result = appStorage.getLanguage();
      expect(result).toBe('zh');
    });
  });

  describe('Config Management', () => {
    test('should save config successfully', () => {
      const config = { apiTimeout: 5000, maxRetries: 3 };
      const result = appStorage.saveConfig(config);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('config', JSON.stringify(config));
    });

    test('should get saved config', () => {
      const config = { apiTimeout: 5000, maxRetries: 3 };
      mockLocalStorage.store['config'] = JSON.stringify(config);
      
      const result = appStorage.getConfig();
      expect(result).toEqual(config);
    });

    test('should return empty object when config not set', () => {
      const result = appStorage.getConfig();
      expect(result).toEqual({});
    });
  });

  describe('Test History Management', () => {
    test('should save test history successfully', () => {
      const history = [
        { key: 'sk-test1', status: 'valid', timestamp: Date.now() },
        { key: 'sk-test2', status: 'invalid', timestamp: Date.now() }
      ];
      
      const result = appStorage.saveTestHistory(history);
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testHistory', JSON.stringify(history));
    });

    test('should limit history to 100 records', () => {
      const history = Array.from({ length: 150 }, (_, i) => ({
        key: `sk-test${i}`,
        status: 'valid',
        timestamp: Date.now()
      }));
      
      appStorage.saveTestHistory(history);
      
      const savedData = JSON.parse(mockLocalStorage.store['testHistory']);
      expect(savedData.length).toBe(100);
      expect(savedData[0]).toEqual(history[50]); // First item should be index 50 (keep last 100)
    });

    test('should get saved test history', () => {
      const history = [
        { key: 'sk-test1', status: 'valid', timestamp: Date.now() }
      ];
      mockLocalStorage.store['testHistory'] = JSON.stringify(history);
      
      const result = appStorage.getTestHistory();
      expect(result).toEqual(history);
    });

    test('should return empty array when history not set', () => {
      const result = appStorage.getTestHistory();
      expect(result).toEqual([]);
    });

    test('should handle saveTestHistory errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const history = [{ key: 'sk-test1', status: 'valid' }];
      const result = appStorage.saveTestHistory(history);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('保存测试历史失败:', expect.any(Error));
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete user workflow', () => {
      // Save user preferences
      expect(appStorage.saveTheme('dark')).toBe(true);
      expect(appStorage.saveLanguage('en')).toBe(true);
      expect(appStorage.saveConfig({ timeout: 10000 })).toBe(true);

      // Save test results
      const testHistory = [
        { key: 'sk-test1', status: 'valid', timestamp: Date.now() },
        { key: 'sk-test2', status: 'invalid', timestamp: Date.now() }
      ];
      expect(appStorage.saveTestHistory(testHistory)).toBe(true);

      // Retrieve all data
      expect(appStorage.getTheme()).toBe('dark');
      expect(appStorage.getLanguage()).toBe('en');
      expect(appStorage.getConfig()).toEqual({ timeout: 10000 });
      expect(appStorage.getTestHistory()).toEqual(testHistory);
    });

    test('should work when localStorage is partially broken', () => {
      // Make setItem fail after first call
      let callCount = 0;
      mockLocalStorage.setItem.mockImplementation((key, value) => {
        callCount++;
        if (callCount > 1) {
          throw new Error('Storage quota exceeded');
        }
        mockLocalStorage.store[key] = value;
      });

      // First save should work
      expect(appStorage.saveTheme('dark')).toBe(true);
      
      // Second save should fail gracefully
      expect(appStorage.saveLanguage('en')).toBe(false);
      
      // Data should still be retrievable
      expect(appStorage.getTheme()).toBe('dark');
      expect(appStorage.getLanguage()).toBe('zh'); // Default value
    });
  });
});