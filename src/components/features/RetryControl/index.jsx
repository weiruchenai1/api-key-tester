import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import FormField from '../../common/FormField';
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


  return (
    <FormField
      id="retry-count"
      label={t('retryControl')}
      help={<small className="text-xs text-tertiary">{t('retryHelp')}</small>}
    >
      <div className={styles.retryContainer}>
        <div className={styles.retrySliderSection}>
          <div className={styles.retrySliderContainer}>
            <input
              id="retry-count"
              type="range"
              className={styles.retrySlider}
              min="0"
              max="10"
              value={state.retryCount}
              onChange={handleSliderChange}
              disabled={state.isTesting}
              aria-label={t('retryControl') || 'Retry count slider'}
            />
            <input
              id="retry-count-number"
              type="number"
              className={styles.retrySliderValue}
              value={state.retryCount}
              min="0"
              max="10"
              onChange={handleInputChange}
              disabled={state.isTesting}
              aria-label={t('retryControl') + ' ' + (t('value') || 'value')}
            />
          </div>
        </div>
      </div>
    </FormField>
  );
};

export default RetryControl;
