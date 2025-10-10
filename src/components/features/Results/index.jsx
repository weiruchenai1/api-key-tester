import React from 'react';
import StatsCards from './StatsCards';
import ResultTabs from './ResultTabs';
import VirtualizedList from './VirtualizedList';
import Loading from '../../common/Loading';
import CopyButtons from './CopyButtons';
import KeyLogModal from '../LogsPreview/KeyLogModal';
import EmptyState from '../../common/EmptyState';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Results = () => {
  const { state, dispatch } = useAppState();
  const { t } = useLanguage();

  const handleTooltipDismiss = () => {
    dispatch({ type: 'DISMISS_LOG_TOOLTIP' });
  };

  return (
    <>
      {/* 检测结果统计 - 始终显示，但在没有结果时显示0 */}
      <StatsCards />

      {/* 密钥列表区域 - 始终显示结果卡片 */}
      <div className="card--primary card--results">
        {state.showLogTooltip && (
          <div className="results-tooltip" role="note">
            <div className="results-tooltip__text">{t('results.logTooltip')}</div>
            <button
              type="button"
              className="results-tooltip__close"
              onClick={handleTooltipDismiss}
              aria-label={t('close') || 'Close'}
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab列表始终显示 */}
        <ResultTabs />

        <div className="results-content">
          {(state.showResults || state.isTesting || state.keyResults.length > 0) ? (
            <VirtualizedList />
          ) : (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              }
              message={t('resultsWillShow')}
            />
          )}
        </div>

        {/* 复制按钮始终显示在底部 */}
        <CopyButtons />
      </div>

      <Loading isVisible={state.isTesting && state.keyResults.length === 0} />
      <KeyLogModal />
    </>
  );
};

export default Results;
