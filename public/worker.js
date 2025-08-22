// Web Worker 用于处理 API 密钥测试
let isProcessing = false;
let shouldCancel = false;
let currentLanguage = 'zh'; // 默认中文

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

  // 通知主线程开始测试
  self.postMessage({
    type: 'KEY_STATUS_UPDATE',
    payload: {
      key: apiKey,
      status: 'testing',
      retryCount: 0
    }
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (shouldCancel) return;

    try {
      if (attempt > 0) {
        // 重试状态
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'retrying',
            retryCount: attempt
          }
        });

        // 重试延迟
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      }

      const result = await testApiKey(apiKey, config);

      // 成功或速率限制：继续处理
      if (result.valid || result.isRateLimit) {
        let finalResult = result;
        
        // 如果是Gemini且启用了付费检测，进行二阶段检测
        if (result.valid && config.apiType === 'gemini' && config.enablePaidDetection) {
          try {
            const paidResult = await testGeminiPaidKey(apiKey, config.model, config);
            finalResult = { ...result, isPaid: paidResult.isPaid };
          } catch (error) {
            // 付费检测失败，但不影响基础验证结果
            finalResult = { ...result, isPaid: null };
          }
        }
        
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: result.valid ? 'valid' : 'rate-limited',
            error: result.error,
            retryCount: attempt,
            isPaid: finalResult.isPaid
          }
        });
        return finalResult;
      }

      // 最后一次尝试：无论结果如何都返回
      if (attempt === maxRetries) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: result.error,
            retryCount: attempt
          }
        });
        return result;
      }

      // 检查是否需要重试
      const statusCode = extractStatusCode(result.error);
      if (!shouldRetry(result.error, statusCode)) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: result.error,
            retryCount: attempt
          }
        });
        return result;
      }

    } catch (error) {
      if (attempt === maxRetries) {
        self.postMessage({
          type: 'KEY_STATUS_UPDATE',
          payload: {
            key: apiKey,
            status: 'invalid',
            error: '测试异常: ' + error.message,
            retryCount: attempt
          }
        });
        return { valid: false, error: error.message, isRateLimit: false };
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

  const match = error.match(/\((\d{3})\)/);
  if (match) {
    return parseInt(match[1]);
  }

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
    default:
      return { valid: false, error: '不支持的API类型', isRateLimit: false };
  }
}

async function testOpenAIKey(apiKey, model, config) {
  try {
    const apiUrl = getApiUrl('openai', '/chat/completions', config.proxyUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      })
    });

    if (!response.ok) {
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true };
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429 };
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false };
    }

    if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests') ||
        errorMessage.toLowerCase().includes('quota exceeded')) {
        return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true };
      }
    }

    if (data && data.choices && Array.isArray(data.choices)) {
      return { valid: true, error: null, isRateLimit: false };
    } else {
      return { valid: false, error: '响应格式错误', isRateLimit: false };
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false };
    }
    return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
  }
}

async function testClaudeKey(apiKey, model, config) {
  try {
    const apiUrl = getApiUrl('claude', '/messages', config.proxyUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false };
    if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false };
    if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true };

    const responseText = await response.text();

    if (response.status === 400) {
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error && errorData.error.type === 'authentication_error') {
          return { valid: false, error: '认证错误', isRateLimit: false };
        }
        if (errorData.error && errorData.error.type === 'rate_limit_error') {
          return { valid: false, error: 'Rate Limit Error', isRateLimit: true };
        }
        if (errorData.error && errorData.error.type === 'invalid_request_error') {
          return { valid: true, error: null, isRateLimit: false };
        }
        return { valid: false, error: 'API错误: ' + (errorData.error.type || 'unknown'), isRateLimit: false };
      } catch {
        return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false };
      }
    }

    if (response.ok) {
      return { valid: true, error: null, isRateLimit: false };
    } else {
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: false };
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false };
    }
    return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
  }
}

async function testGeminiKey(apiKey, model, config) {
  try {
    const apiUrl = getApiUrl('gemini', '/models/' + model + ':generateContent?key=' + apiKey, config.proxyUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Hi"
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 400) return { valid: false, error: getErrorMessage('invalidKey', 400), isRateLimit: false };
      if (response.status === 401) return { valid: false, error: getErrorMessage('authFailed', 401), isRateLimit: false };
      if (response.status === 403) return { valid: false, error: getErrorMessage('permissionDenied', 403), isRateLimit: false };
      if (response.status === 429) return { valid: false, error: getErrorMessage('rateLimited', 429), isRateLimit: true };
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429 };
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return { valid: false, error: getErrorMessage('emptyResponse'), isRateLimit: false };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false };
    }

    if (data && data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      return { valid: true, error: null, isRateLimit: false };
    } else if (data && data.error) {
      const errorMessage = data.error.message || data.error.toString();
      if (errorMessage.toLowerCase().includes('quota exceeded') ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests')) {
        return { valid: false, error: 'Rate Limited: ' + errorMessage, isRateLimit: true };
      }
      return { valid: false, error: 'API错误: ' + errorMessage, isRateLimit: false };
    } else {
      return { valid: false, error: '响应格式错误', isRateLimit: false };
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { valid: false, error: getErrorMessage('networkError'), isRateLimit: false };
    }
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return { valid: false, error: getErrorMessage('jsonParseError'), isRateLimit: false };
    }
    return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
  }
}

async function testGeminiPaidKey(apiKey, model, config) {
  try {
    // 生成长文本内容用于Cache API检测
    const longText = "You are an expert at analyzing transcripts. ".repeat(128);
    
    const apiUrl = getApiUrl('gemini', '/v1beta/cachedContents', config.proxyUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'models/' + model,
        contents: [
          {
            parts: [
              {
                text: longText
              }
            ],
            role: "user"
          }
        ],
        ttl: "30s"
      })
    });

    // 付费Key可以成功访问Cache API
    if (response.ok) {
      return { isPaid: true, error: null };
    }

    // 429错误通常表示免费Key的速率限制
    if (response.status === 429) {
      return { isPaid: false, error: null };
    }

    // 403错误可能表示免费Key无权访问Cache API
    if (response.status === 403) {
      return { isPaid: false, error: null };
    }

    // 其他错误无法确定付费状态
    const errorText = await response.text().catch(() => '');
    return { isPaid: null, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error) {
    return { isPaid: null, error: error.message };
  }
}
