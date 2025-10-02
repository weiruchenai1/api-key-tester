import { getApiUrl } from './base.js';
import { ERROR_MESSAGES } from '../../constants/api.js';

export const testOpenRouterKey = async (apiKey, model, proxyUrl) => {
  try {
    const url = getApiUrl('openrouter', '/chat/completions', proxyUrl);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    if (response.status === 429) {
      return { valid: false, error: ERROR_MESSAGES.RATE_LIMIT_ERROR, isRateLimit: true };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        valid: false,
        error: errorData?.error?.message || `HTTP ${response.status}`,
        isRateLimit: false
      };
    }

    // Parse JSON response in success path to catch parsing errors
    try {
      await response.json();
      return { valid: true, error: null, isRateLimit: false };
    } catch (parseError) {
      return { valid: false, error: parseError.message, isRateLimit: false };
    }
  } catch (error) {
    return { valid: false, error: error.message, isRateLimit: false };
  }
};

export const getOpenRouterModels = async (apiKey, proxyUrl) => {
  try {
    const url = getApiUrl('openrouter', '/models', proxyUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (data && data.data && Array.isArray(data.data)) {
      return data.data
        .map(model => model.id)
        .filter(id => id)
        .sort();
    }
    
    return [];
  } catch (error) {
    console.error('获取OpenRouter模型失败:', error);
    return [];
  }
};
