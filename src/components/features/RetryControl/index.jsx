import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

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
    <div className="space-y-sm">
      <label className="text-sm font-medium text-primary">{t('retryControl')}</label>
      <div className="space-y-md">
        <div className="flex items-center gap-md">
          <input
            type="number"
            className="form-field w-20"
            value={state.retryCount}
            min="0"
            max="10"
            onChange={handleInputChange}
            disabled={state.isTesting}
          />
          <div className="flex-1 flex items-center gap-sm">
            <input
              type="range"
              className="flex-1"
              min="0"
              max="10"
              value={state.retryCount}
              onChange={handleSliderChange}
              disabled={state.isTesting}
            />
            <span className="text-sm text-secondary w-8 text-center">{state.retryCount}</span>
          </div>
        </div>
        <div className="flex gap-xs flex-wrap">
          {presets.map(preset => (
            <button
              key={preset.value}
              type="button"
              className={`btn-base btn-sm ${state.retryCount === preset.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handlePresetClick(preset.value)}
              disabled={state.isTesting}
            >
              {t(preset.key)}
            </button>
          ))}
        </div>
      </div>
      <small className="text-xs text-tertiary">{t('retryHelp')}</small>
    </div>
  );
};

export default RetryControl;
