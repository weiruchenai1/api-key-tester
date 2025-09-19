import React from 'react';
import StatsCards from './StatsCards';
import ResultTabs from './ResultTabs';
import VirtualizedList from './VirtualizedList';
import Loading from '../../common/Loading';
import CopyButtons from './CopyButtons';
import KeyLogModal from '../LogsPreview/KeyLogModal';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Results = () => {
  const { state } = useAppState();
  const { t } = useLanguage();

  return (
    <>
      {(state.showResults || state.isTesting || state.keyResults.length > 0) ? (
        <>
          <StatsCards />
          
          <div className="function-card results-card">
            <ResultTabs />
            <div className="results-content">
              <VirtualizedList />
            </div>
            <CopyButtons />
          </div>
        </>
      ) : (
        <div className="function-card initial-empty-state-card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <div className="empty-text">{t('resultsWillShow')}</div>
          </div>
        </div>
      )}

      <Loading isVisible={state.isTesting && state.keyResults.length === 0} />
      <KeyLogModal />
    </>
  );
};

export default Results;
