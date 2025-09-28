import { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { PAID_DETECTION_KEYS } from '../constants/localStorage';

/**
 * 管理付费检测弹窗的自定义Hook
 * @returns {Object} 包含弹窗状态和相关方法的对象
 */
export const usePaidDetectionPrompt = () => {
  const { dispatch } = useAppState();
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);

  /**
   * 检查是否需要显示付费检测弹窗
   * @param {string} apiType - API类型
   * @returns {boolean} 是否需要显示弹窗
   */
  const checkPaidDetectionPrompt = (apiType) => {
    // 只对Gemini显示弹窗
    if (apiType !== 'gemini') return false;
    
    // 检查是否已经禁用了提示
    const promptDisabled = localStorage.getItem(PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED) === 'true';
    if (promptDisabled) {
      // 如果禁用了提示，使用默认设置
      const defaultSetting = localStorage.getItem(PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING) === 'true';
      dispatch({ type: 'SET_PAID_DETECTION', payload: defaultSetting });
      return false;
    }
    
    return true;
  };

  /**
   * 显示付费检测弹窗
   */
  const showPrompt = () => {
    setShowPaidDetectionPrompt(true);
  };

  /**
   * 隐藏付费检测弹窗
   */
  const hidePrompt = () => {
    setShowPaidDetectionPrompt(false);
  };

  /**
   * 处理付费检测确认
   * @param {boolean} enablePaidDetection - 是否启用付费检测
   */
  const handleConfirm = (enablePaidDetection) => {
    dispatch({ type: 'SET_PAID_DETECTION', payload: enablePaidDetection });
    hidePrompt();
  };

  /**
   * 处理API类型变更，自动检查是否需要显示弹窗
   * @param {string} apiType - 新的API类型
   * @param {Function} onApiTypeChange - API类型变更回调函数
   */
  const handleApiTypeChange = (apiType, onApiTypeChange) => {
    // 执行API类型变更逻辑
    if (onApiTypeChange) {
      onApiTypeChange(apiType);
    }
    
    // 检查是否需要显示付费检测弹窗
    if (checkPaidDetectionPrompt(apiType)) {
      showPrompt();
    }
  };

  return {
    showPaidDetectionPrompt,
    showPrompt,
    hidePrompt,
    handleConfirm,
    checkPaidDetectionPrompt,
    handleApiTypeChange,
  };
};