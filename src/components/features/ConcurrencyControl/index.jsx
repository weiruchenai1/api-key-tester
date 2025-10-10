import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useConcurrency } from '../../../hooks/useConcurrency';
import FormField from '../../common/FormField';
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


  return (
    <FormField
      id="concurrency-count"
      label={t('concurrencyControl')}
    >
      <div className={styles.concurrencyContainer}>
        <div className={styles.concurrencySliderSection}>
          <div className={styles.concurrencySliderContainer}>
            <input
              id="concurrency-count"
              type="range"
              className={styles.concurrencySlider}
              min="1"
              max="50"
              value={Math.min(state.concurrency, 50)}
              onChange={handleSliderChange}
              disabled={state.isTesting}
              aria-label={t('concurrencyControl') || 'Concurrency slider'}
            />
            <input
              id="concurrency-count-number"
              type="number"
              className={styles.concurrencySliderValue}
              value={state.concurrency}
              min="1"
              max="100"
              onChange={handleInputChange}
              disabled={state.isTesting}
              aria-label={t('concurrencyControl') + ' ' + (t('value') || 'value')}
            />
          </div>
        </div>
      </div>
    </FormField>
  );
};

export default ConcurrencyControl;
