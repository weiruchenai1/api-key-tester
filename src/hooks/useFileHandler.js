import { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from './useLanguage';
import { extractApiKeys } from '../utils/fileHandler';

export const useFileHandler = () => {
  const { state, dispatch } = useAppState();
  const { t } = useLanguage();
  const [isImporting, setIsImporting] = useState(false);

  const importFile = useCallback(async (file) => {
    if (!file) return;

    // 验证文件类型
    const fileName = file.name.toLowerCase();
    const isTextFile = fileName.endsWith('.txt') || file.type === 'text/plain' || file.type === '';

    if (!isTextFile) {
      dispatch({
        type: 'SHOW_MESSAGE',
        payload: {
          type: 'error',
          message: t('selectTextFile')
        }
      });
      return;
    }

    // 检查文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      dispatch({
        type: 'SHOW_MESSAGE',
        payload: {
          type: 'error',
          message: t('fileTooLarge')
        }
      });
      return;
    }

    setIsImporting(true);

    try {
      const content = await readFileContent(file);
      const extractedKeys = extractApiKeys(content);

      if (extractedKeys.length > 0) {
        const currentValue = state.apiKeysText.trim();
        const newValue = currentValue
          ? currentValue + '\n' + extractedKeys.join('\n')
          : extractedKeys.join('\n');

        dispatch({ type: 'SET_API_KEYS_TEXT', payload: newValue });
        dispatch({
          type: 'SHOW_MESSAGE',
          payload: {
            type: 'success',
            message: t('importSuccess', { count: extractedKeys.length })
          }
        });
      } else {
        dispatch({
          type: 'SHOW_MESSAGE',
          payload: {
            type: 'warning',
            message: t('noValidKeysFound')
          }
        });
      }
    } catch (error) {
      console.error('文件导入失败:', error);
      dispatch({
        type: 'SHOW_MESSAGE',
        payload: {
          type: 'error',
          message: t('importFailed')
        }
      });
    } finally {
      setIsImporting(false);
    }
  }, [state.apiKeysText, dispatch, t]);

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  };

  return {
    importFile,
    isImporting
  };
};
