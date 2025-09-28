import { testOpenAIKey, getOpenAIModels } from './openai';
import { testClaudeKey, getClaudeModels } from './claude';
import { testGeminiKey, getGeminiModels } from './gemini';
import { testDeepSeekKey, getDeepSeekModels } from './deepseek';
import { testSiliconCloudKey, getSiliconCloudModels, getSiliconCloudBalance } from './siliconcloud';
import { testXAIKey, getXAIModels } from './xai';
import { testOpenRouterKey, getOpenRouterModels } from './openrouter';

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
};

export const testApiKey = async (apiKey, apiType, model, proxyUrl) => {
  switch (apiType) {
    case 'openai':
      return await testOpenAIKey(apiKey, model, proxyUrl);
    case 'claude':
      return await testClaudeKey(apiKey, model, proxyUrl);
    case 'gemini':
      return await testGeminiKey(apiKey, model, proxyUrl);
    case 'deepseek':
      return await testDeepSeekKey(apiKey, model, proxyUrl);
    case 'siliconcloud':
      return await testSiliconCloudKey(apiKey, model, proxyUrl);
    case 'xai':
      return await testXAIKey(apiKey, model, proxyUrl);
    case 'openrouter':
      return await testOpenRouterKey(apiKey, model, proxyUrl);
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
      case 'deepseek':
        return await getDeepSeekModels(apiKey, proxyUrl);
      case 'siliconcloud':
        return await getSiliconCloudModels(apiKey, proxyUrl);
      case 'xai':
        return await getXAIModels(apiKey, proxyUrl);
      case 'openrouter':
        return await getOpenRouterModels(apiKey, proxyUrl);
      default:
        return [];
    }
  } catch (error) {
    console.error('获取可用模型失败:', error);
    return [];
  }
};

export const getApiBalance = async (apiKey, apiType, proxyUrl) => {
  try {
    switch (apiType) {
      case 'siliconcloud':
        return await getSiliconCloudBalance(apiKey, proxyUrl);
      case 'openai':
      case 'claude':
      case 'gemini':
      case 'deepseek':
      case 'xai':
      case 'openrouter':
        return {
          success: false,
          error: '该API类型暂不支持余额查询',
          balance: null
        };
      default:
        return {
          success: false,
          error: '不支持的API类型',
          balance: null
        };
    }
  } catch (error) {
    console.error('获取API余额失败:', error);
    return {
      success: false,
      error: error.message,
      balance: null
    };
  }
};
