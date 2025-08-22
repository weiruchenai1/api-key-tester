import React from 'react';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

const ProgressBar = () => {
  const { t } = useLanguage();
  const { state } = useAppState();

  if (!state.isTesting && state.keyResults.length === 0) {
    return null;
  }

  const completedCount = state.keyResults.filter(k =>
    ['valid', 'invalid', 'rate-limited'].includes(k.status)
  ).length;

  const totalCount = state.keyResults.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-text">
        {state.isTesting ? (
          <span>{t('testing')} {completedCount}/{totalCount} ({Math.round(progress)}%)</span>
        ) : (
          <span>{t('completed')} {completedCount}/{totalCount}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
