import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { usePaidDetectionPrompt } from '../../../hooks/usePaidDetectionPrompt';
import PaidDetectionPrompt from '../PaidDetectionPrompt';

const ApiTypeSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const { showPaidDetectionPrompt, hidePrompt, handleConfirm, handleApiTypeChange } = usePaidDetectionPrompt();

  const handleApiTypeSelect = (apiType) => {
    dispatch({ type: 'SET_API_TYPE', payload: apiType });
    // 清空检测到的模型
    dispatch({ type: 'CLEAR_DETECTED_MODELS' });
  };

  const onApiTypeChange = (e) => {
    const apiType = e.target.value;
    handleApiTypeChange(apiType, handleApiTypeSelect);
  };

  return (
    <div className="space-y-sm">
      <label htmlFor="apiType" className="text-sm font-medium text-primary">{t('selectApi')}</label>
      <select
        id="apiType"
        className="form-field"
        value={state.apiType}
        onChange={onApiTypeChange}
      >
        <option value="openai">OpenAI GPT</option>
        <option value="claude">Claude</option>
        <option value="gemini">Google Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="siliconcloud">SiliconCloud</option>
        <option value="xai">xAI</option>
        <option value="openrouter">OpenRouter</option>
      </select>

      {/* Gemini付费检测弹窗 */}
      <PaidDetectionPrompt
        isOpen={showPaidDetectionPrompt}
        onClose={hidePrompt}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default ApiTypeSelector;
