import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useConcurrency } from '../../../hooks/useConcurrency';

const PresetButtons = () => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const { updateConcurrency } = useConcurrency();

  const presets = [
    { value: 1, key: 'slow' },
    { value: 5, key: 'normal' },
    { value: 10, key: 'fast' },
    { value: 20, key: 'ultra' }
  ];

  const handlePresetClick = (value) => {
    updateConcurrency(value);
  };

  return (
    <div className={styles.presetButtons}>
      {presets.map(preset => (
        <button
          key={preset.value}
          type="button"
          className={`${styles.presetBtn} ${state.concurrency === preset.value ? styles.active : ''}`}
          onClick={() => handlePresetClick(preset.value)}
          disabled={state.isTesting}
        >
          {t(preset.key)}
        </button>
      ))}
    </div>
  );
};

export default PresetButtons;
