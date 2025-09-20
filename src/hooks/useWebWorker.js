import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from './useLanguage';
import { getLogCollector } from '../utils/logCollector';

export const useWebWorker = () => {
  const { dispatch } = useAppState();
  const { language } = useLanguage();
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    // 初始化 Web Worker
    const initWorker = () => {
      try {
        // 确保在GitHub Pages和本地环境都能正确找到worker路径
        let workerPath;
        const isProduction = process.env.NODE_ENV === 'production';
        const publicUrl = process.env.PUBLIC_URL || '';
        
        if (isProduction) {
          // 生产环境：GitHub Pages需要使用PUBLIC_URL
          workerPath = publicUrl ? `${publicUrl}/worker.js` : './worker.js';
        } else {
          // 开发环境：使用绝对路径
          workerPath = '/worker.js';
        }
        
        console.log('Environment info:', {
          NODE_ENV: process.env.NODE_ENV,
          PUBLIC_URL: process.env.PUBLIC_URL,
          isProduction,
          workerPath,
          currentOrigin: window.location.origin,
          currentPathname: window.location.pathname
        });
        workerRef.current = new Worker(workerPath);

        workerRef.current.onmessage = (e) => {
          const { type, payload } = e.data || {};

          switch (type) {
            case 'PONG':
              console.log('Worker connected successfully');
              setIsWorkerReady(true);
              break;
            case 'KEY_STATUS_UPDATE':
              dispatch({ type: 'UPDATE_KEY_STATUS', payload });
              break;
            case 'LOG_EVENT':
              try {
                const collector = getLogCollector && getLogCollector();
                if (collector && collector.enabled) {
                  collector.recordEvent(payload || {});
                }
              } catch (err) {
                console.warn('记录日志事件失败:', err);
              }
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
          console.error('Worker path attempted:', workerPath);
          setIsWorkerReady(false);
        };

        workerRef.current.onmessageerror = (error) => {
          console.error('Worker message error:', error);
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
        console.error('Current environment:', {
          NODE_ENV: process.env.NODE_ENV,
          PUBLIC_URL: process.env.PUBLIC_URL,
          location: window.location
        });
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
  }, [dispatch]);

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

      // 清理函数，防止组件卸载时定时器仍在运行
      return () => {
        clearTimeout(timeout);
        if (workerRef.current) {
          workerRef.current.onmessage = originalOnMessage;
        }
      };
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
