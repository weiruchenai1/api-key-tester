import { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useWebWorker } from './useWebWorker';
import { getAvailableModels as getAvailableModelsFromApi } from '../services/api/base';
import { getLogCollector } from '../utils/logCollector';
import { clearLogEntries } from '../utils/logStorage';
import { showToast } from '../utils/toast';

export const useApiTester = () => {
  const { state, dispatch } = useAppState();
  const { startWorkerTesting, cancelWorkerTesting } = useWebWorker();
  const [isDetecting, setIsDetecting] = useState(false);

  const startTesting = useCallback(async (apiKeys) => {
    if (!apiKeys || apiKeys.length === 0) {
      return;
    }

    let logsCleared = false;

    try {
      const collector = typeof getLogCollector === 'function' ? getLogCollector() : null;
      if (collector && typeof collector.clearLogs === 'function') {
        await collector.clearLogs();
        logsCleared = true;
      }
    } catch (error) {
      console.warn('清理内存日志缓存失败:', error);
    }

    if (!logsCleared) {
      dispatch({ type: 'CLEAR_LOGS' });
      try {
        await clearLogEntries();
      } catch (error) {
        console.warn('清理持久化日志失败:', error);
      }
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
        showToast.success(`检测到 ${models.length} 个可用模型`);
      } else {
        showToast.warning('未检测到可用模型，请检查API密钥和网络设置');
      }
    } catch (error) {
      console.error('模型检测失败:', error);
      showToast.error('模型检测失败: ' + error.message);
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
