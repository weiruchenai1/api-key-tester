import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { MODEL_OPTIONS } from '../../../constants/api';
const ModelSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isDetectedModelsExpanded, setIsDetectedModelsExpanded] = useState(false);
  const currentModels = useMemo(() => MODEL_OPTIONS[state.apiType] || [], [state.apiType]);
  useEffect(() => {
    if (currentModels.length > 0 && !isCustomModel) {
      dispatch({ type: 'SET_MODEL', payload: currentModels[0] });
    }
  }, [currentModels, isCustomModel, dispatch]);

  useEffect(() => {
    // 当检测到模型时自动展开
    if (state.detectedModels.size > 0) {
      setIsDetectedModelsExpanded(true);
    }
  }, [state.detectedModels.size]);

  const handleModelChange = (e) => {
    dispatch({ type: 'SET_MODEL', payload: e.target.value });
  };

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

  return (
    <div className="input-group">
      <label>{t('selectModel')}</label>
      <div className="model-input-group">
        {!isCustomModel ? (
          <select
            className="form-control"
            value={state.model}
            onChange={handleModelChange}
            disabled={state.isTesting}
          >
            {currentModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="form-control"
            placeholder={t('modelInputPlaceholder')}
            value={state.model}
            onChange={handleCustomModelChange}
            disabled={state.isTesting}
          />
        )}
        <button
          type="button"
          className={`model-toggle-btn ${isCustomModel ? 'active' : ''}`}
          onClick={toggleModelInput}
          disabled={state.isTesting}
        >
          {isCustomModel ? t('presetModel') : t('customModel')}
        </button>
      </div>
      <small className="form-help">{t('modelHelp')}</small>

      {/* Gemini付费检测开关 */}
      {state.apiType === 'gemini' && (
        <div className="paid-detection-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={state.enablePaidDetection}
              onChange={(e) => dispatch({ type: 'SET_PAID_DETECTION', payload: e.target.checked })}
              disabled={state.isTesting}
            />
            <span className="checkbox-text">{t('enablePaidDetection')}</span>
          </label>
          <small className="form-help warning">
            {t('paidDetectionHelp')}
          </small>
          {state.enablePaidDetection && (
            <small className="form-warning">
              {t('paidDetectionWarning')}
            </small>
          )}
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
    </div>
  );
};

export default ModelSelector;
