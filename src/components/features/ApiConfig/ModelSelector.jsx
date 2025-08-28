import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useApiTester } from '../../../hooks/useApiTester';
import { MODEL_OPTIONS } from '../../../constants/api';
import PaidDetectionPrompt from '../PaidDetectionPrompt';
const ModelSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const { detectModels, isDetecting } = useApiTester();
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isDetectedModelsExpanded, setIsDetectedModelsExpanded] = useState(false);
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);
  const currentModels = useMemo(() => MODEL_OPTIONS[state.apiType] || [], [state.apiType]);
  useEffect(() => {
    if (currentModels.length > 0 && !isCustomModel) {
      dispatch({ type: 'SET_MODEL', payload: currentModels[0] });
    }
  }, [currentModels, isCustomModel, dispatch]);

  // 检查是否需要显示付费检测弹窗
  const checkPaidDetectionPrompt = (selectedModel) => {
    // 只对Gemini模型显示弹窗
    if (state.apiType !== 'gemini') return false;
    
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

  // 处理模型选择
  const handleModelSelect = (selectedModel) => {
    if (checkPaidDetectionPrompt(selectedModel)) {
      setShowPaidDetectionPrompt(true);
    }
    dispatch({ type: 'SET_MODEL', payload: selectedModel });
  };

  useEffect(() => {
    // 当检测到模型时自动展开
    if (state.detectedModels.size > 0) {
      setIsDetectedModelsExpanded(true);
    }
  }, [state.detectedModels.size]);

  const handleCustomModelChange = (e) => {
    dispatch({ type: 'SET_MODEL', payload: e.target.value });
  };

  const toggleModelInput = () => {
    setIsCustomModel(!isCustomModel);
    if (!isCustomModel && currentModels.length > 0) {
      dispatch({ type: 'SET_MODEL', payload: '' });
    } else if (isCustomModel && currentModels.length > 0) {
      dispatch({ type: 'SET_MODEL', payload: currentModels[0] });
    }
  };

  const selectDetectedModel = (model) => {
    if (isCustomModel) {
      dispatch({ type: 'SET_MODEL', payload: model });
    } else {
      if (!currentModels.includes(model)) {
        setIsCustomModel(true);
        dispatch({ type: 'SET_MODEL', payload: model });
      } else {
        dispatch({ type: 'SET_MODEL', payload: model });
      }
    }
  };

  const toggleDetectedModels = () => {
    setIsDetectedModelsExpanded(!isDetectedModelsExpanded);
  };

  const handleDetectModels = async () => {
    if (!state.apiKeysText.trim()) {
      alert(t('enterApiKeysFirst') || '请先输入API密钥！');
      return;
    }

    const apiKeys = state.apiKeysText.split('\n').filter(key => key.trim());
    if (apiKeys.length === 0) {
      alert(t('enterValidKeys') || '请输入有效的API密钥！');
      return;
    }

    await detectModels(apiKeys[0].trim());
  };

  return (
    <div className="input-group">
      <label>{t('selectModel')}</label>
      <div className="model-input-group">
        {!isCustomModel ? (
          <select
            value={state.enablePaidDetection ? 'gemini-2.5-flash' : state.model}
            onChange={(e) => handleModelSelect(e.target.value)}
            disabled={state.isTesting || state.enablePaidDetection}
            className="form-control"
          >
            {state.enablePaidDetection ? (
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            ) : (
              currentModels.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
        ) : (
          <input
            type="text"
            className="form-control"
            placeholder={t('modelInputPlaceholder')}
            value={state.enablePaidDetection ? 'gemini-2.5-flash' : state.model}
            onChange={handleCustomModelChange}
            disabled={state.isTesting || state.enablePaidDetection}
          />
        )}
        <button
          type="button"
          className={`model-toggle-btn ${isCustomModel ? 'active' : ''}`}
          onClick={toggleModelInput}
          disabled={state.isTesting || state.enablePaidDetection}
        >
          {isCustomModel ? t('presetModel') : t('customModel')}
        </button>
        <button
          type="button"
          className="model-toggle-btn detect-models-btn"
          onClick={handleDetectModels}
          disabled={state.isTesting || isDetecting}
        >
          {isDetecting ? (
            <>🔄 {t('detecting')}</>
          ) : (
            <>🔍 {t('detectModels')}</>
          )}
        </button>
      </div>
      <small className="form-help">{t('modelHelp')}</small>

      {/* 付费检测状态信息 */}
      {state.apiType === 'gemini' && (
        <div className="paid-detection-status">
          <small className={`form-info ${state.enablePaidDetection ? 'enabled' : 'disabled'}`}>
            {state.enablePaidDetection ? '✅ 已开启付费检测' : '❌ 未开启付费检测'}
          </small>
        </div>
      )}

      {/* 检测到的模型 */}
      {state.detectedModels.size > 0 && (
        <div className={`detected-models ${isDetectedModelsExpanded ? 'expanded' : ''}`}>
          <div
            className="detected-models-header"
            onClick={toggleDetectedModels}
          >
            <h4>{t('detectedModelsTitle')} ({state.detectedModels.size})</h4>
            <span className={`collapse-icon ${!isDetectedModelsExpanded ? 'collapsed' : ''}`}>
              ▼
            </span>
          </div>
          {isDetectedModelsExpanded && (
            <div className="model-list-container expanded">
              <div className="model-list">
                {Array.from(state.detectedModels).map(model => (
                  <div
                    key={model}
                    className="model-tag"
                    onClick={() => selectDetectedModel(model)}
                    title={`点击选择模型: ${model}`}
                  >
                    {model}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

export default ModelSelector;
