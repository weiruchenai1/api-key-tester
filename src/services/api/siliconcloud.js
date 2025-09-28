import { getApiUrl } from './base';

export const testSiliconCloudKey = async (apiKey, model, proxyUrl) => {
  try {
    const url = getApiUrl('siliconcloud', '/chat/completions', proxyUrl);

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

export const getSiliconCloudModels = async (apiKey, proxyUrl) => {
  try {
    const url = getApiUrl('siliconcloud', '/models', proxyUrl);

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
    console.error('获取SiliconCloud模型失败:', error);
    return [];
  }
};

export const getSiliconCloudBalance = async (apiKey, proxyUrl) => {
  try {
    const url = getApiUrl('siliconcloud', '/user/info', proxyUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // 返回格式化的余额信息
    return {
      success: true,
      balance: data.data?.balance || 0,
      currency: data.data?.currency || 'CNY',
      userInfo: {
        userId: data.data?.user_id,
        email: data.data?.email,
        nickname: data.data?.nickname
      }
    };
  } catch (error) {
    console.error('获取SiliconCloud余额失败:', error);
    return {
      success: false,
      error: error.message,
      balance: null
    };
  }
};
