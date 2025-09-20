import { saveLogEntry, clearLogEntries } from './logStorage';

/**
 * 日志收集工具
 * 负责接收结构化事件并维护前端可展示的日志数据
 */

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const trimString = (value, maxLength = 4000) => {
  if (value == null) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n...(+' + (str.length - maxLength) + ' chars)';
};

const normalizeHeaders = (headers) => {
  if (!headers) return null;
  try {
    if (typeof headers.forEach === 'function') {
      const result = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    return { ...headers };
  } catch (error) {
    return { error: 'Unable to serialize headers: ' + error.message };
  }
};

const sanitizeRequest = (request = {}) => {
  if (!request) return null;
  return {
    url: request.url,
    method: request.method,
    headers: normalizeHeaders(request.headers),
    body: trimString(request.body)
  };
};

const sanitizeResponse = (response = {}) => {
  if (!response) return null;
  const base = {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeHeaders(response.headers),
    body: trimString(response.body)
  };
  if (Object.prototype.hasOwnProperty.call(response, 'parsed')) {
    base.parsed = response.parsed;
  } else {
    base.parsed = null;
  }
  return base;
};

const sanitizeError = (error) => {
  if (!error) return null;
  if (typeof error === 'string') {
    return { message: error };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }
  return { ...error };
};

const createLogEntry = ({ key, apiType, model, metadata }) => ({
  id: generateId(),
  key,
  keyId: key,
  apiType,
  model,
  metadata: metadata ? { ...metadata } : {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
  timestamp: Date.now(),
  events: [],
  attempts: 0,
  retryCount: 0,
  status: 'pending',
  finalStatus: null,
  totalDurationMs: 0,
  lastError: null,
  lastResponse: null,
  lastRequest: null,
  duration: 0
});

const createEventRecord = (event = {}) => ({
  id: generateId(),
  timestamp: event.timestamp || Date.now(),
  stage: event.stage || 'event',
  attempt: event.attempt || 1,
  slotIndex: Object.prototype.hasOwnProperty.call(event, 'slotIndex') ? event.slotIndex : null,
  status: event.status || null,
  message: event.message ? trimString(event.message, 2000) : null,
  durationMs: Object.prototype.hasOwnProperty.call(event, 'durationMs') ? event.durationMs : null,
  totalDurationMs: Object.prototype.hasOwnProperty.call(event, 'totalDurationMs') ? event.totalDurationMs : null,
  isFinal: !!event.isFinal,
  finalStatus: event.finalStatus || null,
  request: sanitizeRequest(event.request),
  response: sanitizeResponse(event.response),
  error: sanitizeError(event.error),
  extra: event.extra ? JSON.parse(JSON.stringify(event.extra)) : undefined
});

export class LogCollector {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.enabled = false;
    this.logsByKey = new Map();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.logsByKey.clear();
    }
  }

  clearCache() {
    this.logsByKey.clear();
  }

  hydrateLogs(logs = []) {
    if (!Array.isArray(logs)) return;
    logs.forEach((log) => {
      if (log && log.key) {
        this.logsByKey.set(log.key, log);
      }
    });
  }

  recordEvent({ key, apiType, model, metadata = {}, event = {} }) {
    if (!this.enabled || !key) return;

    const eventRecord = createEventRecord(event);
    const existingEntry = this.logsByKey.get(key);
    const startingNewRun = !!existingEntry && event.stage === 'test_start';
    const isNewEntry = !existingEntry;

    let entry;

    if (isNewEntry || startingNewRun) {
      const mergedMetadata = existingEntry ? { ...existingEntry.metadata, ...metadata } : metadata;
      entry = createLogEntry({ key, apiType, model, metadata: mergedMetadata });
      if (existingEntry) {
        entry.id = existingEntry.id;
      }
    } else {
      entry = {
        ...existingEntry,
        metadata: { ...existingEntry.metadata, ...metadata },
        apiType: apiType || existingEntry.apiType,
        model: model || existingEntry.model
      };
    }

    const actionType = isNewEntry ? 'ADD_LOG' : 'UPDATE_LOG';

    const events = entry.events.concat(eventRecord);
    const attempts = Math.max(entry.attempts, eventRecord.attempt || entry.attempts);
    const retryCount = Math.max(entry.retryCount || 0, (eventRecord.attempt || 1) - 1);
    const finalStatus = eventRecord.isFinal
      ? eventRecord.finalStatus || eventRecord.status || entry.finalStatus
      : entry.finalStatus;
    const status = eventRecord.status || finalStatus || entry.status;
    const totalDurationMs = eventRecord.isFinal && eventRecord.totalDurationMs != null
      ? eventRecord.totalDurationMs
      : entry.totalDurationMs;

    const updatedEntry = {
      ...entry,
      events,
      attempts,
      retryCount,
      status,
      finalStatus,
      updatedAt: eventRecord.timestamp,
      timestamp: eventRecord.timestamp,
      totalDurationMs,
      lastError: eventRecord.error || entry.lastError,
      lastResponse: eventRecord.response || entry.lastResponse,
      lastRequest: eventRecord.request || entry.lastRequest,
      duration: eventRecord.durationMs != null ? eventRecord.durationMs : entry.duration
    };

    this.logsByKey.set(key, updatedEntry);
    this.dispatch({
      type: actionType,
      payload: updatedEntry
    });

    const persistPromise = saveLogEntry(updatedEntry);
    if (persistPromise && typeof persistPromise.catch === 'function') {
      persistPromise.catch((error) => {
        console.warn('Failed to persist log entry:', error);
      });
    }
  }

  logApiStart(apiType, key, model, request) {
    this.recordEvent({
      key,
      apiType,
      model,
      event: {
        stage: 'attempt_start',
        status: 'testing',
        request
      }
    });
    const entry = this.logsByKey.get(key);
    return entry ? entry.id : null;
  }

  logApiSuccess(logId, response, duration) {
    if (!this.enabled || !logId) return;
    const entry = [];
    this.logsByKey.forEach(item => {
      if (item.id === logId) {
        entry.push(item);
      }
    });
    if (!entry[0]) return;
    const target = entry[0];
    this.recordEvent({
      key: target.key,
      apiType: target.apiType,
      model: target.model,
      event: {
        stage: 'attempt_result',
        status: 'success',
        response,
        durationMs: duration,
        isFinal: true,
        finalStatus: 'success'
      }
    });
  }

  logApiError(logId, error, duration, retryCount = 0) {
    if (!this.enabled || !logId) return;
    const entry = [];
    this.logsByKey.forEach(item => {
      if (item.id === logId) {
        entry.push(item);
      }
    });
    if (!entry[0]) return;
    const target = entry[0];
    this.recordEvent({
      key: target.key,
      apiType: target.apiType,
      model: target.model,
      event: {
        stage: retryCount > 0 ? 'retry' : 'attempt_result',
        status: retryCount > 0 ? 'retrying' : 'error',
        error,
        durationMs: duration,
        attempt: retryCount + 1,
        isFinal: retryCount === 0,
        finalStatus: retryCount === 0 ? 'error' : undefined
      }
    });
  }

  logApiRetry(logId, retryCount) {
    if (!this.enabled || !logId) return;
    const entry = [];
    this.logsByKey.forEach(item => {
      if (item.id === logId) {
        entry.push(item);
      }
    });
    if (!entry[0]) return;
    const target = entry[0];
    this.recordEvent({
      key: target.key,
      apiType: target.apiType,
      model: target.model,
      event: {
        stage: 'retry_scheduled',
        status: 'retrying',
        attempt: retryCount + 1
      }
    });
  }

  addLog(apiType, key, status, error = null, model = null) {
    this.recordEvent({
      key,
      apiType,
      model,
      event: {
        stage: 'manual',
        status,
        error,
        isFinal: status === 'success' || status === 'error',
        finalStatus: status
      }
    });
  }

  clearLogs() {
    this.clearCache();
    this.dispatch({ type: 'CLEAR_LOGS' });
    const promise = clearLogEntries();
    if (promise && typeof promise.catch === 'function') {
      promise.catch((error) => {
        console.warn('Failed to clear persisted logs:', error);
      });
    }
    return promise;
  }
}

let globalLogCollector = null;

export const initializeLogCollector = (dispatch) => {
  globalLogCollector = new LogCollector(dispatch);
  return globalLogCollector;
};

export const getLogCollector = () => globalLogCollector;

export const logApiCall = (apiType, key, status, error = null, model = null) => {
  if (globalLogCollector) {
    globalLogCollector.addLog(apiType, key, status, error, model);
  }
};

export default LogCollector;

