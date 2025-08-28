import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import PaidDetectionPrompt from '../PaidDetectionPrompt';
import './ApiConfig.module.css';

const ApiTypeSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);

  // 检查是否需要显示付费检测弹窗
  const checkPaidDetectionPrompt = (apiType) => {
    // 只对Gemini显示弹窗
    if (apiType !== 'gemini') return false;
    
    // 检查是否已经禁用了提示
    const promptDisabled = localStorage.getItem('geminiPaidDetectionPromptDisabled') === 'true';
    if (promptDisabled) {
      // 如果禁用了提示，使用默认设置
      const defaultSetting = localStorage.getItem('geminiPaidDetectionDefault') === 'true';
      dispatch({ type: 'SET_PAID_DETECTION', payload: defaultSetting });
      return false;
    }
    
    return true;
  };

  const handleApiTypeChange = (e) => {
    const apiType = e.target.value;
    dispatch({ type: 'SET_API_TYPE', payload: apiType });
    // 清空检测到的模型
    dispatch({ type: 'CLEAR_DETECTED_MODELS' });
    
    // 检查是否需要显示付费检测弹窗
    if (checkPaidDetectionPrompt(apiType)) {
      setShowPaidDetectionPrompt(true);
    }
  };

  return (
    <div className="input-group">
      <label htmlFor="apiType">{t('selectApi')}</label>
      <select
        id="apiType"
        className="form-control"
        value={state.apiType}
        onChange={handleApiTypeChange}
      >
        <option value="openai">OpenAI GPT</option>
        <option value="claude">Claude</option>
        <option value="gemini">Google Gemini</option>
      </select>

      {/* Gemini付费检测弹窗 */}
      <PaidDetectionPrompt
        isOpen={showPaidDetectionPrompt}
        onClose={() => setShowPaidDetectionPrompt(false)}
        onConfirm={(enablePaidDetection) => {
          dispatch({ type: 'SET_PAID_DETECTION', payload: enablePaidDetection });
        }}
      />
    </div>
  );
};

export default ApiTypeSelector;
