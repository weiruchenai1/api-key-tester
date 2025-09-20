const DB_NAME = 'keyTesterLogs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

const isIndexedDBAvailable = () => typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

let dbPromise = null;
let hasWarnedIndexedDbUnavailable = false;

const warnIndexedDbUnavailable = () => {
  if (hasWarnedIndexedDbUnavailable) return;
  hasWarnedIndexedDbUnavailable = true;
  if (typeof window !== 'undefined') {
    if (typeof window.alert === 'function') {
      window.alert('当前浏览器不支持日志持久化，刷新或关闭页面后历史日志将丢失。\nIndexedDB is unavailable, so logs will not be saved.');
    }
    console.warn('IndexedDB is not available; logs will not be persisted.');
  } else {
    console.warn('IndexedDB is not available; logs will not be persisted.');
  }
};

const openDatabase = () => {
  if (!isIndexedDBAvailable()) {
    warnIndexedDbUnavailable();
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        let store;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        } else {
          store = request.transaction.objectStore(STORE_NAME);
        }

        if (store && !store.indexNames.contains('key')) {
          store.createIndex('key', 'key', { unique: false });
        }
        if (store && !store.indexNames.contains('keyId')) {
          store.createIndex('keyId', 'keyId', { unique: false });
        }
        if (store && !store.indexNames.contains('timestamp')) {
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
};

const runTransaction = (mode, operation) => {
  return openDatabase().then((db) => {
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let request;

      try {
        request = operation(store);
      } catch (error) {
        reject(error);
        return;
      }

      tx.oncomplete = () => resolve(request?.result ?? undefined);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  });
};

export const saveLogEntry = (logEntry) => {
  if (!logEntry || !logEntry.id) return Promise.resolve();
  return runTransaction('readwrite', (store) => store.put(logEntry)).catch((error) => {
    console.warn('Failed to save log entry:', error);
  });
};

export const getAllLogEntries = () => {
  return runTransaction('readonly', (store) => store.getAll()).then((logs) => {
    if (!logs) return [];
    return logs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }).catch((error) => {
    console.warn('Failed to load log entries:', error);
    return [];
  });
};

export const getLogEntryByKey = (key) => {
  if (!key) return Promise.resolve(null);
  return runTransaction('readonly', (store) => {
    try {
      const index = store.index('key');
      return index.get(key);
    } catch (error) {
      console.warn('Failed to read log by key via index:', error);
      return store.get(key);
    }
  }).catch((error) => {
    console.warn('Failed to load log entry by key:', error);
    return null;
  });
};

export const clearLogEntries = () => {
  return runTransaction('readwrite', (store) => store.clear()).catch((error) => {
    console.warn('Failed to clear log entries:', error);
  });
};

export const deleteLogEntry = (id) => {
  if (!id) return Promise.resolve();
  return runTransaction('readwrite', (store) => store.delete(id)).catch((error) => {
    console.warn('Failed to delete log entry:', error);
  });
};

export const closeLogDatabase = () => {
  if (!dbPromise) return;
  dbPromise.then((db) => db?.close()).catch(() => {});
  dbPromise = null;
};