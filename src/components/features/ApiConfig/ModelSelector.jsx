import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useApiTester } from '../../../hooks/useApiTester';
import { MODEL_OPTIONS } from '../../../constants/api';
import PaidDetectionPrompt from '../PaidDetectionPrompt';
import styles from './ApiConfig.module.css';

const ModelSelector = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const { detectModels, isDetecting } = useApiTester();
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);

  const currentModels = useMemo(() => MODEL_OPTIONS[state.apiType] || [], [state.apiType]);

  // 合并预设模型和检测到的模型
  const allAvailableModels = useMemo(() => {
    const detectedModelsArray = Array.from(state.detectedModels);
    const combinedModels = [...currentModels];

    // 添加检测到但不在预设列表中的模型
    detectedModelsArray.forEach(model => {
      if (!combinedModels.includes(model)) {
        combinedModels.push(model);
      }
    });

    return combinedModels;
  }, [currentModels, state.detectedModels]);

  useEffect(() => {
    if (allAvailableModels.length > 0 && !isCustomModel && !state.model) {
      dispatch({ type: 'SET_MODEL', payload: allAvailableModels[0] });
    }
  }, [allAvailableModels, isCustomModel, dispatch, state.model]);

  const checkPaidDetectionPrompt = (selectedModel) => {
    if (state.apiType !== 'gemini') return false;

    const promptDisabled = localStorage.getItem('geminiPaidDetectionPromptDisabled') === 'true';
    if (promptDisabled) {
      const defaultSetting = localStorage.getItem('geminiPaidDetectionDefault') === 'true';
      dispatch({ type: 'SET_PAID_DETECTION', payload: defaultSetting });
      return false;
    }

    return true;
  };

  const handleModelSelect = (selectedModel) => {
    if (checkPaidDetectionPrompt(selectedModel)) {
      setShowPaidDetectionPrompt(true);
    }
    dispatch({ type: 'SET_MODEL', payload: selectedModel });
  };

  const handleCustomModelChange = (e) => {
    dispatch({ type: 'SET_MODEL', payload: e.target.value });
  };

  const toggleModelInput = () => {
    setIsCustomModel(!isCustomModel);
    if (!isCustomModel && allAvailableModels.length > 0) {
      dispatch({ type: 'SET_MODEL', payload: '' });
    } else if (isCustomModel && allAvailableModels.length > 0) {
      dispatch({ type: 'SET_MODEL', payload: allAvailableModels[0] });
    }
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

  // 渲染模型选项，区分预设和检测到的模型
  const renderModelOptions = () => {
    const presetModels = currentModels;
    const detectedOnlyModels = Array.from(state.detectedModels).filter(
      model => !currentModels.includes(model)
    );

    return (
      <>
        {/* 预设模型 */}
        {presetModels.map(model => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}

        {/* 检测到的新模型（去掉🔍图标） */}
        {detectedOnlyModels.length > 0 && (
          <>
            <option disabled>──────── {t('detectedModelsTitle')} ────────</option>
            {detectedOnlyModels.map(model => (
              <option key={model} value={model} className={styles.detectedModelOption}>
                {model}
              </option>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <div className={styles.modelSelectorContainer}>
      <label>
        {t('selectModel')}
        {state.detectedModels.size > 0 && (
          <span className={styles.detectedCount}>
            {' '}({t('detecting')} {state.detectedModels.size} {t('models')})
          </span>
        )}
      </label>
      <div className={styles.modelInputRow}>
        {!isCustomModel ? (
          <select
            value={state.enablePaidDetection ? 'gemini-2.5-flash' : state.model}
            onChange={(e) => handleModelSelect(e.target.value)}
            disabled={state.isTesting || state.enablePaidDetection}
            className={styles.modelSelect}
          >
            {state.enablePaidDetection ? (
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            ) : (
              renderModelOptions()
            )}
          </select>
        ) : (
          <input
            type="text"
            className={styles.modelInput}
            placeholder={t('modelInputPlaceholder')}
            value={state.enablePaidDetection ? 'gemini-2.5-flash' : state.model}
            onChange={handleCustomModelChange}
            disabled={state.isTesting || state.enablePaidDetection}
          />
        )}

        <button
          type="button"
          className={`${styles.modelButton} ${isCustomModel ? styles.active : ''}`}
          onClick={toggleModelInput}
          disabled={state.isTesting || state.enablePaidDetection}
        >
          {isCustomModel ? t('presetModel') : t('customModel')}
        </button>

        <button
          type="button"
          className={`${styles.modelButton} ${styles.detectButton}`}
          onClick={handleDetectModels}
          disabled={state.isTesting || isDetecting}
        >
          {isDetecting ? (
            <>{t('detecting')}</>
          ) : (
            <>{t('detectModels')}</>
          )}
        </button>
      </div>

      <small className="form-help">{t('modelHelp')}</small>

      {/* 付费检测状态信息 */}
      {state.apiType === 'gemini' && (
        <div className="paid-detection-status">
          <small className={`form-info ${state.enablePaidDetection ? 'enabled' : 'disabled'}`}>
            {state.enablePaidDetection ? t('paidDetectionEnabled') : t('paidDetectionDisabled')}
          </small>
        </div>
      )}

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
