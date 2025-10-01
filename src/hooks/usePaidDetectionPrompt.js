import { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { PAID_DETECTION_KEYS } from '../constants/localStorage';

/**
 * 管理付费检测弹窗的自定义Hook
 * @returns {{showPaidDetectionPrompt: boolean, showPrompt: () => void, hidePrompt: () => void, handleConfirm: (enablePaidDetection: boolean) => void, checkPaidDetectionPrompt: (apiType: string) => boolean, handleApiTypeChange: (apiType: string, onApiTypeChange?: (apiType:string)=>void) => void}}
 */
export const usePaidDetectionPrompt = () => {
  const { dispatch } = useAppState();
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);

  /**
   * 检查是否需要显示付费检测弹窗
   * @param {string} apiType - API类型
   * @returns {boolean} 是否需要显示弹窗
   */
  const checkPaidDetectionPrompt = useCallback((apiType) => {
    // 只对Gemini显示弹窗
    if (apiType !== 'gemini') return false;
    
    // 检查是否已经禁用了提示
    let promptDisabled = false;
    try {
      promptDisabled = localStorage.getItem(PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED) === 'true';
    } catch {}
    
    if (promptDisabled) {
      // 如果禁用了提示，使用默认设置
      let defaultSetting = false;
      try {
        defaultSetting = localStorage.getItem(PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING) === 'true';
      } catch {}
      dispatch({ type: 'SET_PAID_DETECTION', payload: defaultSetting });
      return false;
    }
    
    return true;
  }, [dispatch]);

  /**
   * 显示付费检测弹窗
   */
  const showPrompt = useCallback(() => {
    setShowPaidDetectionPrompt(true);
  }, []);

  /**
   * 隐藏付费检测弹窗
   */
  const hidePrompt = useCallback(() => {
    setShowPaidDetectionPrompt(false);
  }, []);

  /**
   * 处理付费检测确认
   * @param {boolean} enablePaidDetection - 是否启用付费检测
   */
  const handleConfirm = useCallback((enablePaidDetection) => {
    dispatch({ type: 'SET_PAID_DETECTION', payload: enablePaidDetection });
    hidePrompt();
  }, [dispatch, hidePrompt]);

  /**
   * 处理API类型变更，自动检查是否需要显示弹窗
   * @param {string} apiType - 新的API类型
   * @param {Function} onApiTypeChange - API类型变更回调函数
   */
  const handleApiTypeChange = useCallback((apiType, onApiTypeChange) => {
    // 执行API类型变更逻辑
    if (onApiTypeChange) {
      onApiTypeChange(apiType);
    }
    
    // 检查是否需要显示付费检测弹窗
    if (checkPaidDetectionPrompt(apiType)) {
      showPrompt();
    }
  }, [checkPaidDetectionPrompt, showPrompt]);

  return {
    showPaidDetectionPrompt,
    showPrompt,
    hidePrompt,
    handleConfirm,
    checkPaidDetectionPrompt,
    handleApiTypeChange,
  };
};