import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from './useLanguage';

export const useWebWorker = () => {
  const { dispatch } = useAppState();
  const { language } = useLanguage();
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    // 初始化 Web Worker
    const initWorker = () => {
      try {
        workerRef.current = new Worker('./worker.js');

        workerRef.current.onmessage = (e) => {
          const { type, payload } = e.data;

          switch (type) {
            case 'PONG':
              setIsWorkerReady(true);
              break;
            case 'KEY_STATUS_UPDATE':
              dispatch({ type: 'UPDATE_KEY_STATUS', payload });
              break;
            case 'TESTING_COMPLETE':
              dispatch({ type: 'TESTING_COMPLETE' });
              break;
            default:
              console.warn('Unknown worker message type:', type);
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Worker error:', error);
          setIsWorkerReady(false);
        };

        // 测试连接
        workerRef.current.postMessage({ type: 'PING' });

        // 发送语言设置
        workerRef.current.postMessage({ 
          type: 'SET_LANGUAGE', 
          payload: { language } 
        });

      } catch (error) {
        console.error('Failed to create worker:', error);
        setIsWorkerReady(false);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dispatch, language]);

  // 监听语言变化
  useEffect(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ 
        type: 'SET_LANGUAGE', 
        payload: { language } 
      });
    }
  }, [language, isWorkerReady]);

  const startWorkerTesting = useCallback(async (config) => {
    if (!workerRef.current || !isWorkerReady) {
      throw new Error('Worker not ready');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker testing timeout'));
      }, 300000); // 5分钟超时

      const originalOnMessage = workerRef.current.onmessage;

      workerRef.current.onmessage = (e) => {
        originalOnMessage(e);

        if (e.data.type === 'TESTING_COMPLETE') {
          clearTimeout(timeout);
          workerRef.current.onmessage = originalOnMessage;
          resolve();
        }
      };

      workerRef.current.postMessage({
        type: 'START_TESTING',
        payload: config
      });
    });
  }, [isWorkerReady]);

  const cancelWorkerTesting = useCallback(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ type: 'CANCEL_TESTING' });
    }
  }, [isWorkerReady]);

  return {
    isWorkerReady,
    startWorkerTesting,
    cancelWorkerTesting
  };
};
