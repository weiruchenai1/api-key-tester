import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import styles from './RetryControl.module.css';

const RetryControl = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleInputChange = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) value = 0;
    if (value > 10) value = 10;
    e.target.value = value;
    dispatch({ type: 'SET_RETRY_COUNT', payload: value });
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    dispatch({ type: 'SET_RETRY_COUNT', payload: value });
  };

  const handlePresetClick = (value) => {
    dispatch({ type: 'SET_RETRY_COUNT', payload: value });
  };

  const presets = [
    { value: 0, key: 'noRetry' },
    { value: 2, key: 'lightRetry' },
    { value: 3, key: 'normalRetry' },
    { value: 5, key: 'heavyRetry' }
  ];

  return (
    <div className="input-group">
      <label>{t('retryControl')}</label>
      <div className={styles.retryContainer}>
        <div className={styles.retryInputSection}>
          <input
            type="number"
            className="form-control"
            value={state.retryCount}
            min="0"
            max="10"
            onChange={handleInputChange}
            disabled={state.isTesting}
          />
        </div>
        <div className={styles.retrySliderSection}>
          <div className={styles.retrySliderContainer}>
            <input
              type="range"
              className={styles.retrySlider}
              min="0"
              max="10"
              value={state.retryCount}
              onChange={handleSliderChange}
              disabled={state.isTesting}
            />
            <span className={styles.retrySliderValue}>{state.retryCount}</span>
          </div>
          <div className={styles.retryPresetButtons}>
            {presets.map(preset => (
              <button
                key={preset.value}
                type="button"
                className={`${styles.retryPresetBtn} ${state.retryCount === preset.value ? styles.active : ''}`}
                onClick={() => handlePresetClick(preset.value)}
                disabled={state.isTesting}
              >
                {t(preset.key)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <small className="form-help">{t('retryHelp')}</small>
    </div>
  );
};

export default RetryControl;
