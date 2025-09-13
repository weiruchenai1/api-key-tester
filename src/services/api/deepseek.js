import { getApiUrl } from './base';

export const testDeepSeekKey = async (apiKey, model, proxyUrl) => {
  try {
    const url = getApiUrl('deepseek', '/chat/completions', proxyUrl);

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
      return { valid: false, error: '速率限制', isRateLimit: true };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        valid: false,
        error: errorData?.error?.message || `HTTP ${response.status}`,
        isRateLimit: false
      };
    }

    return { valid: true, error: null, isRateLimit: false };
  } catch (error) {
    return { valid: false, error: error.message, isRateLimit: false };
  }
};

export const getDeepSeekModels = async (apiKey, proxyUrl) => {
  try {
    const url = getApiUrl('deepseek', '/models', proxyUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data?.map(model => model.id) || [];
  } catch (error) {
    console.error('获取DeepSeek模型失败:', error);
    return [];
  }
};
