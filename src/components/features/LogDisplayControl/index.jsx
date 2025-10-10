import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const LogDisplayControl = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleToggleDetailedLogs = () => {
    const newValue = !state.showDetailedLogs;
    dispatch({ type: 'SET_SHOW_DETAILED_LOGS', payload: newValue });
  };

  return (
    <div className="space-y-sm">
      <label className="text-sm font-medium text-primary">
        {t('showDetailedLogs')}
      </label>
      <div className="space-y-sm">
        <div className="flex items-center gap-sm">
          <label className="switch-base">
            <input
              type="checkbox"
              checked={state.showDetailedLogs}
              onChange={handleToggleDetailedLogs}
              disabled={state.isTesting}
              className="switch-input"
            />
            <span className="switch-slider"></span>
          </label>
          <span className="text-sm text-secondary">
            {state.showDetailedLogs ? t('enabled') : t('disabled')}
          </span>
        </div>
        <p className="text-xs text-tertiary">
          {t('showDetailedLogsDescription')}
        </p>
      </div>
    </div>
  );
};

export default LogDisplayControl;