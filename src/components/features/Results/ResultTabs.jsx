import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const ResultTabs = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const baseTabs = [
    { key: 'all', labelKey: 'all' },
    { key: 'valid', labelKey: 'validKeys' },
    { key: 'invalid', labelKey: 'invalidKeys' },
    { key: 'rate-limited', labelKey: 'rateLimitedKeys' }
  ];

  // Add paid keys tab if Gemini paid detection is enabled
  const tabs = [...baseTabs];
  if (state.apiType === 'gemini' && state.enablePaidDetection) {
    tabs.splice(2, 0, { key: 'paid', labelKey: 'paidKeys' });
  }

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
