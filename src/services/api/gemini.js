import { getApiUrl } from './base';

export const testGeminiKey = async (apiKey, model, proxyUrl) => {
  try {
    const apiUrl = getApiUrl('gemini', `/models/${model}:generateContent?key=${apiKey}`, proxyUrl);
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
      if (response.status === 400) return { valid: false, error: 'API密钥无效 (400)', isRateLimit: false };
      if (response.status === 401) return { valid: false, error: '认证失败 (401)', isRateLimit: false };
      if (response.status === 403) return { valid: false, error: '权限不足 (403)', isRateLimit: false };
      if (response.status === 429) return { valid: false, error: 'Rate Limited (429)', isRateLimit: true };
      return { valid: false, error: 'HTTP ' + response.status, isRateLimit: response.status === 429 };
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return { valid: false, error: '空响应', isRateLimit: false };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return { valid: false, error: 'JSON解析失败', isRateLimit: false };
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
      return { valid: false, error: '网络连接失败', isRateLimit: false };
    }
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return { valid: false, error: 'JSON解析失败', isRateLimit: false };
    }
    return { valid: false, error: '请求失败: ' + error.message, isRateLimit: false };
  }
};

export const getGeminiModels = async (apiKey, proxyUrl) => {
  try {
    const apiUrl = getApiUrl('gemini', `/models?key=${apiKey}`, proxyUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data && data.models && Array.isArray(data.models)) {
      const models = data.models
        .filter(model => {
          return model.supportedGenerationMethods &&
            model.supportedGenerationMethods.includes('generateContent');
        })
        .map(model => {
          return model.name.replace('models/', '');
        })
        .sort();

      return models;
    }
    return [];
  } catch (error) {
    return [];
  }
};
