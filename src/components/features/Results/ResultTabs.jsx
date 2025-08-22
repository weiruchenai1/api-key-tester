import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const ResultTabs = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const tabs = [
    { key: 'all', labelKey: 'all' },
    { key: 'valid', labelKey: 'validKeys' },
    { key: 'invalid', labelKey: 'invalidKeys' },
    { key: 'rate-limited', labelKey: 'rateLimitedKeys' }
  ];

  const handleTabChange = (tabKey) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabKey });
  };

  return (
    <div className="results-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab ${state.activeTab === tab.key ? 'active' : ''}`}
          onClick={() => handleTabChange(tab.key)}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default ResultTabs;
