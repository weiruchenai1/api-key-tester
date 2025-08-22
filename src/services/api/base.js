import { testOpenAIKey, getOpenAIModels } from './openai';
import { testClaudeKey, getClaudeModels } from './claude';
import { testGeminiKey, getGeminiModels } from './gemini';

export const getApiUrl = (apiType, endpoint, proxyUrl) => {
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
      default:
        throw new Error('Unsupported API type: ' + apiType);
    }
  }
};

export const testApiKey = async (apiKey, apiType, model, proxyUrl) => {
  switch (apiType) {
    case 'openai':
      return await testOpenAIKey(apiKey, model, proxyUrl);
    case 'claude':
      return await testClaudeKey(apiKey, model, proxyUrl);
    case 'gemini':
      return await testGeminiKey(apiKey, model, proxyUrl);
    default:
      return { valid: false, error: '不支持的API类型', isRateLimit: false };
  }
};

export const getAvailableModels = async (apiKey, apiType, proxyUrl) => {
  try {
    switch (apiType) {
      case 'openai':
        return await getOpenAIModels(apiKey, proxyUrl);
      case 'claude':
        return await getClaudeModels(apiKey, proxyUrl);
      case 'gemini':
        return await getGeminiModels(apiKey, proxyUrl);
      default:
        return [];
    }
  } catch (error) {
    console.error('获取可用模型失败:', error);
    return [];
  }
};
