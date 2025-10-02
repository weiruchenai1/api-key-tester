import { vi } from 'vitest';
/**
 * LogStorage 工具测试
 */

import {
  saveLogEntry,
  getAllLogEntries,
  getLogEntryByKey,
  clearLogEntries,
  deleteLogEntry,
  closeLogDatabase
} from '../../utils/logStorage';

// Mock IndexedDB
class MockIDBDatabase {
  constructor() {
    this.objectStoreNames = {
      contains: vi.fn(() => false)
    };
    this.version = 1;
    this.isOpen = true;
    this.stores = new Map();
  }
  
  transaction(storeNames, mode) {
    return new MockIDBTransaction(storeNames, mode, this);
  }
  
  createObjectStore(name, options) {
    const store = new MockIDBObjectStore(name, options);
    this.stores.set(name, store);
    return store;
  }
  
  close() {
    this.isOpen = false;
  }
}

class MockIDBTransaction {
  constructor(storeNames, mode, db) {
    this.objectStoreNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.mode = mode;
    this.db = db;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
    this.error = null;
    this.finished = false;
  }
  
  objectStore(name) {
    return this.db.stores.get(name) || new MockIDBObjectStore(name);
  }
  
  complete() {
    this.finished = true;
    if (this.oncomplete) {
      setTimeout(() => this.oncomplete(), 0);
    }
  }
  
  abort(error) {
    this.finished = true;
    this.error = error;
    if (this.onabort) {
      setTimeout(() => this.onabort(), 0);
    }
  }
  
  fail(error) {
    this.finished = true;
    this.error = error;
    if (this.onerror) {
      setTimeout(() => this.onerror(), 0);
    }
  }
}

class MockIDBObjectStore {
  constructor(name, options = {}) {
    this.name = name;
    this.keyPath = options.keyPath;
    this.data = new Map();
    this.indices = new Map();
    this.indexNames = {
      contains: vi.fn((name) => this.indices.has(name))
    };
  }
  
  createIndex(name, keyPath, options = {}) {
    const index = new MockIDBIndex(name, keyPath, options, this);
    this.indices.set(name, index);
    return index;
  }
  
  index(name) {
    return this.indices.get(name) || new MockIDBIndex(name, name, {}, this);
  }
  
  put(data) {
    const key = data[this.keyPath] || data.id;
    this.data.set(key, { ...data });
    return new MockIDBRequest('success', data);
  }
  
  get(key) {
    const result = this.data.get(key) || null;
    return new MockIDBRequest('success', result);
  }
  
  getAll() {
    const result = Array.from(this.data.values());
    return new MockIDBRequest('success', result);
  }
  
  delete(key) {
    const existed = this.data.has(key);
    this.data.delete(key);
    return new MockIDBRequest('success', existed);
  }
  
  clear() {
    this.data.clear();
    return new MockIDBRequest('success', undefined);
  }
}

class MockIDBIndex {
  constructor(name, keyPath, options, store) {
    this.name = name;
    this.keyPath = keyPath;
    this.unique = options.unique || false;
    this.store = store;
  }
  
  get(key) {
    // Find first item with matching key
    for (const item of this.store.data.values()) {
      if (item[this.keyPath] === key) {
        return new MockIDBRequest('success', item);
      }
    }
    return new MockIDBRequest('success', null);
  }
}

class MockIDBRequest {
  constructor(status, result) {
    this.readyState = 'done';
    this.result = result;
    this.error = status === 'error' ? new Error('Mock error') : null;
    this.onsuccess = null;
    this.onerror = null;
    
    // Simulate async behavior
    setTimeout(() => {
      if (status === 'success' && this.onsuccess) {
        this.onsuccess();
      } else if (status === 'error' && this.onerror) {
        this.onerror();
      }
    }, 0);
  }
}

class MockIDBFactory {
  constructor() {
    this.databases = new Map();
  }
  
  open(name, version) {
    let db = this.databases.get(name);
    const request = new MockIDBRequest('success', null);
    
    setTimeout(() => {
      if (!db || (version && db.version < version)) {
        db = new MockIDBDatabase();
        db.version = version || 1;
        this.databases.set(name, db);
        
        // Trigger upgrade if needed
        if (request.onupgradeneeded) {
          request.result = db;
          request.transaction = new MockIDBTransaction(['logs'], 'versionchange', db);
          request.onupgradeneeded();
          request.transaction.complete();
        }
      }
      
      request.result = db;
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }
}

describe('LogStorage', () => {
  let mockIndexedDB;
  let originalIndexedDB;
  let originalWindow;

  beforeEach(() => {
    // Mock window and IndexedDB
    originalWindow = global.window;
    originalIndexedDB = global.indexedDB;
    
    mockIndexedDB = new MockIDBFactory();
    
    global.window = {
      indexedDB: mockIndexedDB,
      alert: vi.fn(),
      console: {
        warn: vi.fn()
      }
    };
    
    global.indexedDB = mockIndexedDB;
    
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.window = originalWindow;
    global.indexedDB = originalIndexedDB;
    closeLogDatabase(); // Clean up connections
  });

  describe('saveLogEntry', () => {
    test('should save log entry successfully', async () => {
      const logEntry = {
        id: 'test-id',
        key: 'test-key',
        timestamp: Date.now(),
        message: 'Test log'
      };

      const result = await saveLogEntry(logEntry);
      
      // Should not throw error
      expect(result).toBeUndefined();
    });

    test('should handle invalid log entry', async () => {
      const result = await saveLogEntry(null);
      expect(result).toBeUndefined();
      
      const result2 = await saveLogEntry({});
      expect(result2).toBeUndefined();
    });

    test('should handle save errors gracefully', async () => {
      // Mock database error
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('error', null);
        return request;
      });

      const logEntry = {
        id: 'test-id',
        key: 'test-key',
        timestamp: Date.now()
      };

      const result = await saveLogEntry(logEntry);
      expect(result).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('Failed to save log entry:', expect.any(Error));
    });
  });

  describe('getAllLogEntries', () => {
    test('should retrieve all log entries sorted by timestamp', async () => {
      // First save some entries
      const entries = [
        { id: '1', key: 'key1', timestamp: 3000, message: 'Third' },
        { id: '2', key: 'key2', timestamp: 1000, message: 'First' },
        { id: '3', key: 'key3', timestamp: 2000, message: 'Second' }
      ];

      for (const entry of entries) {
        await saveLogEntry(entry);
      }

      const result = await getAllLogEntries();
      
      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe(1000);
      expect(result[1].timestamp).toBe(2000);
      expect(result[2].timestamp).toBe(3000);
    });

    test('should return empty array when database unavailable', async () => {
      // Mock no IndexedDB
      global.window = {};
      global.indexedDB = undefined;

      const result = await getAllLogEntries();
      expect(result).toEqual([]);
    });

    test('should handle retrieval errors gracefully', async () => {
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('error', null);
        return request;
      });

      const result = await getAllLogEntries();
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Failed to load log entries:', expect.any(Error));
    });
  });

  describe('getLogEntryByKey', () => {
    test('should retrieve log entry by key using index', async () => {
      const logEntry = {
        id: 'test-id',
        key: 'test-key',
        timestamp: Date.now(),
        message: 'Test log'
      };

      await saveLogEntry(logEntry);
      const result = await getLogEntryByKey('test-key');
      
      expect(result).toEqual(logEntry);
    });

    test('should return null for non-existent key', async () => {
      const result = await getLogEntryByKey('non-existent');
      expect(result).toBeNull();
    });

    test('should handle empty key', async () => {
      const result = await getLogEntryByKey('');
      expect(result).toBeNull();
      
      const result2 = await getLogEntryByKey(null);
      expect(result2).toBeNull();
    });

    test('should fallback to direct get if index fails', async () => {
      const logEntry = {
        id: 'test-id',
        key: 'test-key',
        timestamp: Date.now()
      };

      await saveLogEntry(logEntry);
      
      // Force index lookup to fail
      const originalIndex = MockIDBObjectStore.prototype.index;
      MockIDBObjectStore.prototype.index = function () {
        throw new Error('Index failed');
      };
      try {
        const result = await getLogEntryByKey('test-key');
        expect(result).toBeTruthy();
      } finally {
        MockIDBObjectStore.prototype.index = originalIndex;
      }
    });

    test('should handle retrieval errors gracefully', async () => {
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('error', null);
        return request;
      });

      const result = await getLogEntryByKey('test-key');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Failed to load log entry by key:', expect.any(Error));
    });
  });

  describe('clearLogEntries', () => {
    test('should clear all log entries', async () => {
      // Add some entries first
      await saveLogEntry({ id: '1', key: 'key1', timestamp: Date.now() });
      await saveLogEntry({ id: '2', key: 'key2', timestamp: Date.now() });

      await clearLogEntries();
      
      const result = await getAllLogEntries();
      expect(result).toEqual([]);
    });

    test('should handle clear errors gracefully', async () => {
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('error', null);
        return request;
      });

      const result = await clearLogEntries();
      expect(result).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('Failed to clear log entries:', expect.any(Error));
    });
  });

  describe('deleteLogEntry', () => {
    test('should delete specific log entry', async () => {
      const logEntry = {
        id: 'test-id',
        key: 'test-key',
        timestamp: Date.now()
      };

      await saveLogEntry(logEntry);
      await deleteLogEntry('test-id');
      
      const result = await getLogEntryByKey('test-key');
      expect(result).toBeNull();
    });

    test('should handle empty id', async () => {
      const result = await deleteLogEntry('');
      expect(result).toBeUndefined();
      
      const result2 = await deleteLogEntry(null);
      expect(result2).toBeUndefined();
    });

    test('should handle delete errors gracefully', async () => {
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('error', null);
        return request;
      });

      const result = await deleteLogEntry('test-id');
      expect(result).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('Failed to delete log entry:', expect.any(Error));
    });
  });

  describe('closeLogDatabase', () => {
    test('should close database connection', () => {
      // Should not throw
      closeLogDatabase();
      expect(true).toBe(true);
    });

    test('should handle close errors gracefully', () => {
      // Mock error in close
      mockIndexedDB.open = vi.fn().mockImplementation(() => {
        const request = new MockIDBRequest('success', {
          close: () => {
            throw new Error('Close error');
          }
        });
        return request;
      });

      // Should not throw
      closeLogDatabase();
      expect(true).toBe(true);
    });
  });

  describe('IndexedDB Unavailable Scenarios', () => {
    test('should warn when IndexedDB is unavailable in browser', async () => {
      global.window = {
        alert: vi.fn()
      };
      global.indexedDB = undefined;

      const result = await saveLogEntry({ id: 'test', key: 'test' });
      
      expect(result).toBeUndefined();
      expect(global.window.alert).toHaveBeenCalledWith(
        expect.stringContaining('当前浏览器不支持日志持久化')
      );
      expect(console.warn).toHaveBeenCalledWith(
        'IndexedDB is not available; logs will not be persisted.'
      );
    });

    test('should warn when window is unavailable (Node.js)', async () => {
      global.window = undefined;
      global.indexedDB = undefined;

      const result = await saveLogEntry({ id: 'test', key: 'test' });
      
      expect(result).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith(
        'IndexedDB is not available; logs will not be persisted.'
      );
    });

    test('should only warn once about IndexedDB unavailability', async () => {
      global.window = {
        alert: vi.fn()
      };
      global.indexedDB = undefined;

      await saveLogEntry({ id: 'test1', key: 'test1' });
      await saveLogEntry({ id: 'test2', key: 'test2' });
      await getAllLogEntries();

      // Should only alert once
      expect(global.window.alert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Schema and Upgrades', () => {
    test('should create object store and indices on upgrade', async () => {
      const logEntry = { id: 'test', key: 'test-key', timestamp: Date.now() };
      
      // This should trigger database creation and upgrade
      await saveLogEntry(logEntry);
      
      // Verify the entry was saved (implicit test that schema was created)
      const result = await getLogEntryByKey('test-key');
      expect(result).toEqual(logEntry);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle transaction abort', async () => {
      // Mock a transaction that aborts
      const originalTransaction = MockIDBDatabase.prototype.transaction;
      MockIDBDatabase.prototype.transaction = function(storeNames, mode) {
        const tx = new MockIDBTransaction(storeNames, mode, this);
        setTimeout(() => tx.abort(new Error('Transaction aborted')), 10);
        return tx;
      };

      const result = await saveLogEntry({ id: 'test', key: 'test' });
      expect(result).toBeUndefined();

      // Restore
      MockIDBDatabase.prototype.transaction = originalTransaction;
    });

    test('should handle operation errors within transaction', async () => {
      // Mock store operation that throws
      const originalPut = MockIDBObjectStore.prototype.put;
      MockIDBObjectStore.prototype.put = function() {
        throw new Error('Operation failed');
      };

      const result = await saveLogEntry({ id: 'test', key: 'test' });
      expect(result).toBeUndefined();

      // Restore
      MockIDBObjectStore.prototype.put = originalPut;
    });

    test('should handle missing result in transaction completion', async () => {
      const logEntry = { id: 'test', key: 'test', timestamp: Date.now() };
      
      // Mock request without result
      const originalPut = MockIDBObjectStore.prototype.put;
      MockIDBObjectStore.prototype.put = function() {
        return { result: undefined };
      };

      const result = await saveLogEntry(logEntry);
      expect(result).toBeUndefined();

      // Restore
      MockIDBObjectStore.prototype.put = originalPut;
    });
  });
});