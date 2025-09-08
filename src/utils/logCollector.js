/**
 * 日志收集工具
 * 用于收集和管理API调用日志
 */

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 脱敏API密钥
const maskApiKey = (key) => {
  if (!key || typeof key !== 'string') return 'Unknown';
  
  if (key.startsWith('sk-')) {
    // OpenAI格式
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  } else if (key.startsWith('AIza')) {
    // Gemini格式
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  } else {
    // 其他格式
    return key.substring(0, 6) + '...' + key.substring(key.length - 4);
  }
};

// 格式化错误信息
const formatError = (error) => {
  if (!error) return null;
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error.response) {
    // HTTP响应错误
    return {
      message: error.message || 'HTTP Error',
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    };
  }
  
  if (error.message) {
    return { message: error.message };
  }
  
  return { message: 'Unknown error' };
};

// 创建日志条目
export const createLogEntry = ({
  apiType,
  keyId,
  operation = 'test',
  status = 'pending',
  error = null,
  request = null,
  response = null,
  duration = 0,
  model = null,
  retryCount = 0
}) => {
  return {
    id: generateId(),
    timestamp: Date.now(),
    apiType,
    keyId: maskApiKey(keyId),
    operation,
    status, // 'success', 'error', 'pending', 'retrying'
    error: formatError(error),
    request: request ? {
      url: request.url,
      method: request.method,
      headers: request.headers ? { ...request.headers, authorization: '[MASKED]' } : null,
      body: request.body
    } : null,
    response: response ? {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    } : null,
    duration,
    model,
    retryCount
  };
};

// 日志收集器类
export class LogCollector {
  constructor(dispatch) {
    this.dispatch = dispatch;
    this.enabled = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // 记录API调用开始
  logApiStart(apiType, keyId, model, request) {
    if (!this.enabled) return null;
    
    const logEntry = createLogEntry({
      apiType,
      keyId,
      operation: 'test',
      status: 'pending',
      request,
      model
    });
    
    this.dispatch({ type: 'ADD_LOG', payload: logEntry });
    return logEntry.id;
  }

  // 记录API调用成功
  logApiSuccess(logId, response, duration) {
    if (!this.enabled || !logId) return;
    
    // 更新现有日志条目
    this.dispatch({
      type: 'UPDATE_LOG',
      payload: {
        id: logId,
        status: 'success',
        response,
        duration
      }
    });
  }

  // 记录API调用错误
  logApiError(logId, error, duration, retryCount = 0) {
    if (!this.enabled || !logId) return;
    
    // 更新现有日志条目
    this.dispatch({
      type: 'UPDATE_LOG',
      payload: {
        id: logId,
        status: retryCount > 0 ? 'retrying' : 'error',
        error,
        duration,
        retryCount
      }
    });
  }

  // 记录重试
  logApiRetry(logId, retryCount) {
    if (!this.enabled || !logId) return;
    
    this.dispatch({
      type: 'UPDATE_LOG',
      payload: {
        id: logId,
        status: 'retrying',
        retryCount
      }
    });
  }

  // 添加简单日志（用于测试）
  addLog(apiType, keyId, status, error = null, model = null) {
    if (!this.enabled) return;
    
    const logEntry = createLogEntry({
      apiType,
      keyId,
      operation: 'test',
      status,
      error,
      model,
      duration: Math.floor(Math.random() * 2000) + 500 // 模拟持续时间
    });
    
    this.dispatch({ type: 'ADD_LOG', payload: logEntry });
  }

  // 清空日志
  clearLogs() {
    this.dispatch({ type: 'CLEAR_LOGS' });
  }
}

// 创建全局日志收集器实例
let globalLogCollector = null;

export const initializeLogCollector = (dispatch) => {
  globalLogCollector = new LogCollector(dispatch);
  return globalLogCollector;
};

export const getLogCollector = () => {
  return globalLogCollector;
};

// 便捷函数
export const logApiCall = (apiType, keyId, status, error = null, model = null) => {
  if (globalLogCollector) {
    globalLogCollector.addLog(apiType, keyId, status, error, model);
  }
};

export default LogCollector;
