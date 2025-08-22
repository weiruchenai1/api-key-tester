import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useConcurrency } from '../../../hooks/useConcurrency';
import styles from './ConcurrencyControl.module.css';

const ConcurrencyControl = () => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const { updateConcurrency } = useConcurrency();

  const handleInputChange = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 100) value = 100;
    e.target.value = value;
    updateConcurrency(value);
  };

  const handleSliderChange = (e) => {
    updateConcurrency(parseInt(e.target.value));
  };

  const handlePresetClick = (value) => {
    updateConcurrency(value);
  };

  const presets = [
    { value: 1, key: 'slow' },
    { value: 5, key: 'normal' },
    { value: 10, key: 'fast' },
    { value: 20, key: 'ultra' }
  ];

  return (
    <div className="input-group">
      <label>{t('concurrencyControl')}</label>
      <div className={styles.concurrencyContainer}>
        <div className={styles.concurrencyInputSection}>
          <input
            type="number"
            className="form-control"
            value={state.concurrency}
            min="1"
            max="100"
            onChange={handleInputChange}
            disabled={state.isTesting}
          />
        </div>
        <div className={styles.concurrencySliderSection}>
          <div className={styles.concurrencySliderContainer}>
            <input
              type="range"
              className={styles.concurrencySlider}
              min="1"
              max="50"
              value={Math.min(state.concurrency, 50)}
              onChange={handleSliderChange}
              disabled={state.isTesting}
            />
            <span className={styles.concurrencySliderValue}>{state.concurrency}</span>
          </div>
          <div className={styles.concurrencyPresetButtons}>
            {presets.map(preset => (
              <button
                key={preset.value}
                type="button"
                className={`${styles.concurrencyPresetBtn} ${state.concurrency === preset.value ? styles.active : ''}`}
                onClick={() => handlePresetClick(preset.value)}
                disabled={state.isTesting}
              >
                {t(preset.key)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcurrencyControl;
