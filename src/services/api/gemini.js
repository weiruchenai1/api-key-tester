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

export const testGeminiPaidKey = async (apiKey, model, proxyUrl) => {
  try {
    // 生成长文本内容用于Cache API检测 (参考项目的做法)
    const longText = "You are an expert at analyzing transcripts.".repeat(128);
    
    const apiUrl = getApiUrl('gemini', '/cachedContents', proxyUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'models/gemini-2.5-flash', // 固定使用 gemini-2.5-flash
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
        generationConfig: {
          thinkingConfig: {
            thinkingBudget: 0
          }
        },
        ttl: "30s"
      })
    });

    // 付费Key可以成功访问Cache API
    if (response.ok) {
      return { isPaid: true, error: null, cacheApiStatus: response.status };
    }

    // 严格按照参考项目的错误处理逻辑
    if (response.status === 429) {
      // 429 Rate Limit = 免费Key
      return { isPaid: false, error: null, cacheApiStatus: response.status };
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      // 4xx错误通常表示Key无效或权限不足，归类为免费Key
      return { isPaid: false, error: null, cacheApiStatus: response.status };
    }

    // 其他错误无法确定付费状态
    const errorText = await response.text().catch(() => '');
    return { isPaid: null, error: `HTTP ${response.status}: ${errorText}`, cacheApiStatus: response.status };
  } catch (error) {
    return { isPaid: null, error: error.message };
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
