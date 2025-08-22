import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import './ApiConfig.module.css';

const ApiTypeSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleApiTypeChange = (e) => {
    const apiType = e.target.value;
    dispatch({ type: 'SET_API_TYPE', payload: apiType });
    // 清空检测到的模型
    dispatch({ type: 'CLEAR_DETECTED_MODELS' });
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
    </div>
  );
};

export default ApiTypeSelector;
