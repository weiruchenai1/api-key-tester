import { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useWebWorker } from './useWebWorker';
import { getAvailableModels as getAvailableModelsFromApi } from '../services/api/base';

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
        maxRetries: state.retryCount,
        enablePaidDetection: state.enablePaidDetection
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
      const models = await getAvailableModelsFromApi(apiKey, state.apiType, state.proxyUrl);

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
