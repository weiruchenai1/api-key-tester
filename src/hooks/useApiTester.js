import { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useWebWorker } from './useWebWorker';

export const useApiTester = () => {
  const { state, dispatch } = useAppState();
  const { startWorkerTesting, cancelWorkerTesting } = useWebWorker();
  const [isDetecting, setIsDetecting] = useState(false);

  const startTesting = useCallback(async (apiKeys) => {
    if (!apiKeys || apiKeys.length === 0) {
      return;
    }

    dispatch({ type: 'START_TESTING', payload: { keys: apiKeys } });

    try {
      await startWorkerTesting({
        apiKeys,
        apiType: state.apiType,
        model: state.model,
        proxyUrl: state.proxyUrl,
        concurrency: state.concurrency,
        maxRetries: state.retryCount
      });
    } catch (error) {
      console.error('测试过程出现错误:', error);
      dispatch({
        type: 'SHOW_MESSAGE',
        payload: {
          type: 'error',
          message: '测试过程出现错误: ' + error.message
        }
      });
    }
  }, [state, dispatch, startWorkerTesting]);

  const cancelTesting = useCallback(() => {
    cancelWorkerTesting();
    dispatch({ type: 'CANCEL_TESTING' });
  }, [cancelWorkerTesting, dispatch]);

  const detectModels = useCallback(async (apiKey) => {
    if (isDetecting) return;

    setIsDetecting(true);
    dispatch({ type: 'CLEAR_DETECTED_MODELS' });

    try {
      const models = await getAvailableModels(apiKey, state.apiType, state.proxyUrl);

      if (models && models.length > 0) {
        dispatch({ type: 'SET_DETECTED_MODELS', payload: models });
        alert(`检测到 ${models.length} 个可用模型`);
      } else {
        alert('未检测到可用模型，请检查API密钥和网络设置');
      }
    } catch (error) {
      console.error('模型检测失败:', error);
      alert('模型检测失败: ' + error.message);
    } finally {
      setIsDetecting(false);
    }
  }, [state.apiType, state.proxyUrl, dispatch, isDetecting]);

  return {
    startTesting,
    cancelTesting,
    detectModels,
    isDetecting,
    isTesting: state.isTesting
  };
};

// 获取可用模型的函数
async function getAvailableModels(apiKey, apiType, proxyUrl) {
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
}

async function getOpenAIModels(apiKey, proxyUrl) {
  try {
    const baseUrl = proxyUrl || 'https://openai.weiruchenai.me/v1';
    const apiUrl = baseUrl + '/models';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data && data.data && Array.isArray(data.data)) {
      const models = data.data
        .filter(model => {
          const id = model.id.toLowerCase();
          return !id.includes('embed') &&
            !id.includes('whisper') &&
            !id.includes('tts') &&
            !id.includes('dall-e') &&
            !id.includes('moderation');
        })
        .map(model => model.id)
        .sort();

      return models;
    }
    return [];
  } catch (error) {
    console.error('OpenAI模型检测失败:', error);
    throw error;
  }
}

async function getClaudeModels(apiKey, proxyUrl) {
  // Claude通常没有公开的models接口，返回常见模型列表进行测试
  const commonModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  const availableModels = [];
  const baseUrl = proxyUrl || 'https://claude.weiruchenai.me/v1';

  // 测试每个模型是否可用
  for (const model of commonModels.slice(0, 3)) { // 只测试前3个，避免过多请求
    try {
      const response = await fetch(baseUrl + '/messages', {
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

      if (response.ok || response.status === 400) {
        availableModels.push(model);
      }
    } catch (error) {
      continue;
    }
  }

  return availableModels;
}

async function getGeminiModels(apiKey, proxyUrl) {
  try {
    const baseUrl = proxyUrl || 'https://gemini.weiruchenai.me/v1beta';
    const apiUrl = baseUrl + '/models?key=' + apiKey;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
    console.error('Gemini模型检测失败:', error);
    throw error;
  }
}
