// Web Worker 用于处理 API 密钥测试
let isProcessing = false;
let shouldCancel = false;
let currentLanguage = 'zh'; // 默认中文
const keyGlobalStartTime = new Map();

const MAX_LOG_BODY_LENGTH = 4000;

const truncateForLog = (value, maxLength = MAX_LOG_BODY_LENGTH) => {
  if (value == null) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n...(+' + (str.length - maxLength) + ' chars)';
};

const headersToObject = (headers) => {
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
    return { error: 'serialize_headers_failed', message: error.message };
  }
};

const createRequestLog = ({ url, method, headers, body }) => ({
  url,
  method,
  headers: headersToObject(headers),
  body: truncateForLog(body)
});

const createResponseLog = async (response) => {
  if (!response) return null;
  const clone = response.clone ? response.clone() : response;
  let bodyText = null;
  try {
    bodyText = await clone.text();
  } catch (error) {
    bodyText = '<<无法读取响应正文: ' + error.message + '>>';
  }
  let parsed = null;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : null;
  } catch (error) {
    parsed = null;
  }
  return {
    status: response.status,
    statusText: response.statusText,
    headers: headersToObject(response.headers),
    body: truncateForLog(bodyText),
    parsed
  };
};

const postLogEvent = (key, config, event) => {
  if (!key) return;
  self.postMessage({
    type: 'LOG_EVENT',
    payload: {
      key,
      apiType: config.apiType,
      model: config.model,
      metadata: {
        proxyUrl: config.proxyUrl,
        enablePaidDetection: config.enablePaidDetection,
        concurrency: config.concurrency
      },
      event
    }
  });
};

// 错误信息翻译
const ERROR_MESSAGES = {
  zh: {
    invalidKey: 'API密钥无效',
    authFailed: '认证失败',
    permissionDenied: '权限不足',
    rateLimited: '速率限制',
    emptyResponse: '空响应',
    jsonParseError: 'JSON解析失败',
    responseFormatError: '响应格式错误',
    networkError: '网络连接失败',
    requestFailed: '请求失败',
    testException: '测试异常',
    authError: '认证错误',
    apiError: 'API错误',
    quotaExceeded: '配额超出'
  },
  en: {
    invalidKey: 'Invalid API Key',
    authFailed: 'Auth Failed',
    permissionDenied: 'Permission Denied',
    rateLimited: 'Rate Limited',
    emptyResponse: 'Empty Response',
    jsonParseError: 'JSON Parse Error',
    responseFormatError: 'Response Format Error',
    networkError: 'Network Connection Failed',
    requestFailed: 'Request Failed',
    testException: 'Test Exception',
    authError: 'Authentication Error',
    apiError: 'API Error',
    quotaExceeded: 'Quota Exceeded'
  }
};

function getErrorMessage(key, statusCode = null) {
  const messages = ERROR_MESSAGES[currentLanguage] || ERROR_MESSAGES.zh;
  const message = messages[key] || key;
  return statusCode ? `${message} (${statusCode})` : message;
}

// 监听主线程消息
self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'START_TESTING':
      startTesting(payload);
      break;
    case 'CANCEL_TESTING':
      shouldCancel = true;
      break;
    case 'SET_LANGUAGE':
      currentLanguage = payload.language;
      break;
    case 'PING':
      self.postMessage({ type: 'PONG' });
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

async function startTesting({ apiKeys, apiType, model, proxyUrl, concurrency, maxRetries, enablePaidDetection }) {
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  shouldCancel = false;

  try {
    await processKeysWithConcurrency(apiKeys, {
      apiType,
      model,
      proxyUrl,
      concurrency,
      maxRetries,
      enablePaidDetection
    });
  } finally {
    isProcessing = false;
    shouldCancel = false;
    self.postMessage({ type: 'TESTING_COMPLETE' });
  }
}

async function processKeysWithConcurrency(apiKeys, config) {
  const { concurrency } = config;
  const keyQueue = [...apiKeys];
  const activeSlots = new Array(concurrency).fill(null);
  let nextKeyIndex = 0;

  // 初始填满所有并发槽位
  for (let i = 0; i < concurrency && i < keyQueue.length; i++) {
    activeSlots[i] = processKeyWithRetry(keyQueue[nextKeyIndex], config, i);
    nextKeyIndex++;
  }

  // 持续处理直到所有密钥完成或被取消
  while (activeSlots.some(slot => slot !== null) && !shouldCancel) {
    // 等待任意一个槽位完成
    const completedIndex = await waitForAnySlotCompletion(activeSlots);

    // 如果还有待测试的密钥，启动新的测试占用这个槽位
    if (nextKeyIndex < keyQueue.length) {
      activeSlots[completedIndex] = processKeyWithRetry(keyQueue[nextKeyIndex], config, completedIndex);
      nextKeyIndex++;
    } else {
      // 没有新密钥了，释放槽位
      activeSlots[completedIndex] = null;
    }
  }
}

async function waitForAnySlotCompletion(activeSlots) {
  const activePromises = activeSlots
    .map((promise, index) => promise ? promise.then(() => index) : null)
    .filter(p => p !== null);

  if (activePromises.length === 0) {
    throw new Error('没有活跃的测试任务');
  }

  return await Promise.race(activePromises);
}

async function processKeyWithRetry(apiKey, config, slotIndex) {
  const { maxRetries } = config;

  const globalStart = Date.now();
  keyGlobalStartTime.set(apiKey, globalStart);

  self.postMessage({
    type: 'KEY_STATUS_UPDATE',
    payload: {
      key: apiKey,
      status: 'testing',
      retryCount: 0
    }
  });

  postLogEvent(apiKey, config, {
    stage: 'test_start',
    attempt: 1,
    slotIndex,
    status: 'testing',
    timestamp: globalStart,
    message: '开始测试'
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (shouldCancel) {
      postLogEvent(apiKey, config, {
        stage: 'cancelled',
        attempt: attempt + 1,
        slotIndex,
        status: 'cancelled',
        isFinal: true,
        finalStatus: 'cancelled',
        totalDurationMs: Date.now() - globalStart,
        message: '任务被取消'
      });
      keyGlobalStartTime.delete(apiKey);
      return;
    }

    const attemptIndex = attempt + 1;
    const attemptStart = Date.now();

    postLogEvent(apiKey, config, {
      stage: 'attempt_start',
      attempt: attemptIndex,
      slotIndex,
      status: attempt === 0 ? 'testing' : 'retrying',
      timestamp: attemptStart,
      message: '第' + attemptIndex + '次尝试'
    });

    try {
      if (attempt > 0) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'retrying',
            retryCount: attempt
          }
        });

        postLogEvent(apiKey, config, {
          stage: 'retry_wait',
          attempt: attemptIndex,
          slotIndex,
          status: 'retrying',
          message: '等待重试'
        });

        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      }

      const result = await testApiKey(apiKey, config);
      const attemptDuration = Date.now() - attemptStart;

      postLogEvent(apiKey, config, {
        stage: 'attempt_result',
        attempt: attemptIndex,
        slotIndex,
        status: result.valid ? 'success' : (result.isRateLimit ? 'rate-limited' : 'error'),
        durationMs: attemptDuration,
        request: result.requestLog,
        response: result.responseLog,
        error: result.error,
        extra: result.extra || null
      });

      if (result.valid || result.isRateLimit) {
        let finalResult = result;

        if (result.valid && config.apiType === 'gemini' && config.enablePaidDetection) {
          try {
            const paidStart = Date.now();
            const paidResult = await testGeminiPaidKey(apiKey, config.model, config);

            postLogEvent(apiKey, config, {
              stage: 'paid_detection',
              attempt: attemptIndex,
              slotIndex,
              status: paidResult.isPaid === true ? 'paid' : (paidResult.isPaid === false ? 'free' : 'unknown'),
              durationMs: Date.now() - paidStart,
              request: paidResult.requestLog,
              response: paidResult.responseLog,
              error: paidResult.error,
              extra: { cacheApiStatus: paidResult.cacheApiStatus }
            });

            if (paidResult.isPaid === true) {
              finalResult = { ...result, isPaid: true, cacheApiStatus: paidResult.cacheApiStatus };
            } else if (paidResult.isPaid === false) {
              finalResult = { ...result, isPaid: false, cacheApiStatus: paidResult.cacheApiStatus };
            } else {
              finalResult = { ...result, isPaid: null, cacheApiStatus: paidResult.cacheApiStatus };
            }
          } catch (error) {
            postLogEvent(apiKey, config, {
              stage: 'paid_detection',
              attempt: attemptIndex,
              slotIndex,
              status: 'error',
              error: error.message || error,
              extra: { phase: 'paid_detection_failed' }
            });
            finalResult = { ...result, isPaid: false };
          }
        }

        let finalStatus;
        if (finalResult.isPaid === true) {
          finalStatus = 'paid';
        } else if (result.valid) {
          finalStatus = 'valid';
        } else {
          finalStatus = 'rate-limited';
        }

        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: finalStatus,
            error: result.error,
            retryCount: attempt,
            isPaid: finalResult.isPaid,
            cacheApiStatus: finalResult.cacheApiStatus,
            statusCode: extractStatusCode(result.error)
          }
        });

        postLogEvent(apiKey, config, {
          stage: 'final',
          attempt: attemptIndex,
          slotIndex,
          status: finalStatus,
          finalStatus,
          isFinal: true,
          totalDurationMs: Date.now() - globalStart,
          error: result.error,
          extra: {
            isPaid: finalResult.isPaid,
            cacheApiStatus: finalResult.cacheApiStatus
          }
        });

        keyGlobalStartTime.delete(apiKey);
        return finalResult;
      }

      if (attempt === maxRetries) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: result.error,
            retryCount: attempt,
            statusCode: extractStatusCode(result.error)
          }
        });

        postLogEvent(apiKey, config, {
          stage: 'final',
          attempt: attemptIndex,
          slotIndex,
          status: 'invalid',
          finalStatus: 'invalid',
          isFinal: true,
          totalDurationMs: Date.now() - globalStart,
          error: result.error
        });

        keyGlobalStartTime.delete(apiKey);
        return result;
      }

      const statusCode = extractStatusCode(result.error);
      if (!shouldRetry(result.error, statusCode)) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: result.error,
            retryCount: attempt,
            statusCode: extractStatusCode(result.error)
          }
        });

        postLogEvent(apiKey, config, {
          stage: 'final',
          attempt: attemptIndex,
          slotIndex,
          status: 'invalid',
          finalStatus: 'invalid',
          isFinal: true,
          totalDurationMs: Date.now() - globalStart,
          error: result.error
        });

        keyGlobalStartTime.delete(apiKey);
        return result;
      }

      postLogEvent(apiKey, config, {
        stage: 'retry_scheduled',
        attempt: attemptIndex + 1,
        slotIndex,
        status: 'retrying',
        error: result.error,
        message: '准备进行下一次重试'
      });

    } catch (error) {
      postLogEvent(apiKey, config, {
        stage: 'attempt_exception',
        attempt: attempt + 1,
        slotIndex,
        status: 'error',
        error: error.message || error,
        durationMs: Date.now() - attemptStart
      });

      if (attempt === maxRetries) {
        const finalError = '测试异常: ' + (error.message || error);
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: finalError,
            retryCount: attempt,
            statusCode: extractStatusCode(finalError)
          }
        });

        postLogEvent(apiKey, config, {
          stage: 'final',
          attempt: attempt + 1,
          slotIndex,
          status: 'invalid',
          finalStatus: 'invalid',
          isFinal: true,
          totalDurationMs: Date.now() - globalStart,
          error: finalError
        });

        keyGlobalStartTime.delete(apiKey);
        return { valid: false, error: finalError, isRateLimit: false };
      }
    }
  }
}

function shouldRetry(error, statusCode) {
  // 403、502、503、504 等临时错误需要重试
  if ([403, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  if (error && typeof error === 'string') {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('timeout') ||
      errorLower.includes('network') ||
      errorLower.includes('连接') ||
      errorLower.includes('fetch')) {
      return true;
    }
  }

  return false;
}

function extractStatusCode(error) {
  if (!error || typeof error !== 'string') return null;

  // 匹配括号中的3位数字状态码，如 "认证失败 (401)" 或 "权限不足 (403)"
  const match = error.match(/\((\d{3})\)$/);
  if (match) {
    return parseInt(match[1]);
  }

  // 匹配 "HTTP" + 空格 + 状态码的格式
  if (error.includes('HTTP ')) {
    const httpMatch = error.match(/HTTP (\d{3})/);
    if (httpMatch) {
      return parseInt(httpMatch[1]);
    }
  }

  return null;
}

function getApiUrl(apiType, endpoint, proxyUrl) {
  if (proxyUrl) {
    const baseUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
    return baseUrl + endpoint;
  } else {
    switch (apiType) {
      case 'openai':
        return 'https://openai.weiruchenai.me/v1' + endpoint;
      case 'claude':
        return 'https://claude.weiruchenai.me/v1' + endpoint;
      case 'gemini':
        return 'https://gemini.weiruchenai.me/v1beta' + endpoint;
      case 'deepseek':
        return 'https://api.deepseek.com/v1' + endpoint;
      case 'siliconcloud':
        return 'https://api.siliconflow.cn/v1' + endpoint;
      case 'xai':
        return 'https://api.x.ai/v1' + endpoint;
      case 'openrouter':
        return 'https://openrouter.ai/api/v1' + endpoint;
      default:
        throw new Error('Unsupported API type: ' + apiType);
    }
  }
}

async function testApiKey(apiKey, config) {
  const { apiType, model } = config;

  switch (apiType) {
    case 'openai':
      return await testOpenAIKey(apiKey, model, config);
    case 'claude':
      return await testClaudeKey(apiKey, model, config);
    case 'gemini':
      return await testGeminiKey(apiKey, model, config);
    case 'deepseek':
      return await testDeepSeekKey(apiKey, model, config);
    case 'siliconcloud':
      return await testSiliconCloudKey(apiKey, model, config);
    case 'xai':
      return await testXAIKey(apiKey, model, config);
    case 'openrouter':
      return await testOpenRouterKey(apiKey, model, config);
    default:
      return { valid: false, error: '不支持的API类型', isRateLimit: false };
  }
}

async function testOpenAIKey(apiKey, model, config) {
  const apiUrl = getApiUrl('openai', '/chat/completions', config.proxyUrl);
  const payload = {
    model: model,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1
  };
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    if (!responseLog.body || responseLog.body.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false, requestLog, responseLog };
    }

    const data = responseLog.parsed;
    if (!data) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (typeof errorMessage === 'string') {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('quota exceeded')) {
          return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true, requestLog, responseLog };
        }
      }
    }

    if (data && Array.isArray(data.choices)) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: '响应格式错误', isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testClaudeKey(apiKey, model, config) {
  const apiUrl = getApiUrl('claude', '/messages', config.proxyUrl);
  const payload = {
    model: model,
    max_tokens: 1,
    messages: [{ role: 'user', content: 'Hi' }]
  };
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
    if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
    if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };

    if (response.status === 400) {
      const errorData = responseLog.parsed;
      if (errorData && errorData.error) {
        if (errorData.error.type === 'authentication_error') {
          return { valid: false, error: '认证错误', isRateLimit: false, requestLog, responseLog };
        }
        if (errorData.error.type === 'rate_limit_error') {
          return { valid: false, error: 'Rate Limit Error', isRateLimit: true, requestLog, responseLog };
        }
        if (errorData.error.type === 'invalid_request_error') {
          return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
        }
        return { valid: false, error: 'API错误: ' + (errorData.error.type || 'unknown'), isRateLimit: false, requestLog, responseLog };
      }
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (response.ok) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: 'HTTP ' + response.status, isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testGeminiKey(apiKey, model, config) {
  const apiUrl = getApiUrl('gemini', '/models/' + model + ':generateContent?key=' + apiKey, config.proxyUrl);
  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'Hi'
          }
        ]
      }
    ]
  };
  const headers = {
    'Content-Type': 'application/json'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 400) return { valid: false, error: getErrorMessage('invalidKey', 400), isRateLimit: false, requestLog, responseLog };
      if (response.status === 401) return { valid: false, error: getErrorMessage('authFailed', 401), isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: getErrorMessage('permissionDenied', 403), isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: getErrorMessage('rateLimited', 429), isRateLimit: true, requestLog, responseLog };
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    const data = responseLog.parsed;
    if (!responseLog.body || responseLog.body.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false, requestLog, responseLog };
    }

    if (!data) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (data && Array.isArray(data.candidates) && data.candidates.length > 0) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (typeof errorMessage === 'string') {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('quota exceeded') || lower.includes('rate limit') || lower.includes('too many requests')) {
          return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true, requestLog, responseLog };
        }
      }
      return { valid: false, error: 'API错误: ' + errorMessage, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: '响应格式错误', isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    if (error.name === 'SyntaxError' && message.includes('JSON')) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testDeepSeekKey(apiKey, model, config) {
  const apiUrl = getApiUrl('deepseek', '/chat/completions', config.proxyUrl);
  const payload = {
    model: model,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1
  };
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };
      if (responseLog.parsed && responseLog.parsed.error && responseLog.parsed.error.message) {
        return { valid: false, error: responseLog.parsed.error.message, isRateLimit: false, requestLog, responseLog };
      }
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testSiliconCloudKey(apiKey, model, config) {
  const apiUrl = getApiUrl('siliconcloud', '/chat/completions', config.proxyUrl);
  const payload = {
    model: model,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1
  };
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };
      if (responseLog.parsed && responseLog.parsed.error && responseLog.parsed.error.message) {
        return { valid: false, error: responseLog.parsed.error.message, isRateLimit: false, requestLog, responseLog };
      }
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    const data = responseLog.parsed;
    if (!responseLog.body || responseLog.body.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false, requestLog, responseLog };
    }

    if (!data) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (typeof errorMessage === 'string') {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('quota exceeded')) {
          return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true, requestLog, responseLog };
        }
      }
    }

    if (data && Array.isArray(data.choices)) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: '响应格式错误', isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testXAIKey(apiKey, model, config) {
  const apiUrl = getApiUrl('xai', '/chat/completions', config.proxyUrl);
  const payload = {
    model: model,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1
  };
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };
      if (responseLog.parsed && responseLog.parsed.error && responseLog.parsed.error.message) {
        return { valid: false, error: responseLog.parsed.error.message, isRateLimit: false, requestLog, responseLog };
      }
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    const data = responseLog.parsed;
    if (!responseLog.body || responseLog.body.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false, requestLog, responseLog };
    }

    if (!data) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (typeof errorMessage === 'string') {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('quota exceeded')) {
          return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true, requestLog, responseLog };
        }
      }
    }

    if (data && Array.isArray(data.choices)) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: '响应格式错误', isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testOpenRouterKey(apiKey, model, config) {
  const apiUrl = getApiUrl('openrouter', '/chat/completions', config.proxyUrl);
  const payload = {
    model: model,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1
  };
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://api-key-tester.com',
    'X-Title': 'API Key Tester'
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false, requestLog, responseLog };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true, requestLog, responseLog };
      if (responseLog.parsed && responseLog.parsed.error && responseLog.parsed.error.message) {
        return { valid: false, error: responseLog.parsed.error.message, isRateLimit: false, requestLog, responseLog };
      }
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429, requestLog, responseLog };
    }

    const data = responseLog.parsed;
    if (!responseLog.body || responseLog.body.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false, requestLog, responseLog };
    }

    if (!data) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false, requestLog, responseLog };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (typeof errorMessage === 'string') {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('quota exceeded')) {
          return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true, requestLog, responseLog };
        }
      }
    }

    if (data && Array.isArray(data.choices)) {
      return { valid: true, error: null, isRateLimit: false, requestLog, responseLog };
    }

    return { valid: false, error: '响应格式错误', isRateLimit: false, requestLog, responseLog };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false, requestLog, responseLog: null };
    }
    return { valid: false, error: '请求失败: ' + message, isRateLimit: false, requestLog, responseLog: null };
  }
}

async function testGeminiPaidKey(apiKey, model, config) {
  const longText = 'You are an expert at analyzing transcripts.'.repeat(128);
  const apiUrl = getApiUrl('gemini', '/cachedContents', config.proxyUrl);
  const payload = {
    model: 'models/gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            text: longText
          }
        ],
        role: 'user'
      }
    ],
    ttl: '30s'
  };
  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  };
  const requestLog = createRequestLog({ url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseLog = await createResponseLog(response);

    if (response.ok) {
      return { isPaid: true, error: null, cacheApiStatus: response.status, requestLog, responseLog };
    }

    if (response.status === 429) {
      return { isPaid: false, error: null, cacheApiStatus: response.status, requestLog, responseLog };
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { isPaid: false, error: null, cacheApiStatus: response.status, requestLog, responseLog };
    }

    const bodyText = responseLog.body || '';
    return {
      isPaid: null,
      error: 'HTTP ' + response.status + ': ' + bodyText,
      cacheApiStatus: response.status,
      requestLog,
      responseLog
    };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    return { isPaid: null, error: message, requestLog, responseLog: null };
  }
}
