import { getApiUrl } from './base';

export const testClaudeKey = async (apiKey, model, proxyUrl) => {
  try {
    const apiUrl = getApiUrl('claude', '/messages', proxyUrl);
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
        return { valid: false, error: 'JSON解析失败', isRateLimit: false };
      }
    }

    if (response.ok) {
      return { valid: true, error: null, isRateLimit: false };
    } else {
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: false };
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { valid: false, error: '网络连接失败', isRateLimit: false };
    }
    return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
  }
};

export const getClaudeModels = async (apiKey, proxyUrl) => {
  const commonModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  const availableModels = [];

  for (const model of commonModels) {
    try {
      const result = await testClaudeKey(apiKey, model, proxyUrl);
      if (result.valid) {
        availableModels.push(model);
      }
    } catch (error) {
      continue;
    }
  }

  return availableModels;
};
