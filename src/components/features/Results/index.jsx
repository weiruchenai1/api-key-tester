import React from 'react';
import StatsCards from './StatsCards';
import ResultTabs from './ResultTabs';
import VirtualizedList from './VirtualizedList';
import Loading from '../../common/Loading';
import CopyButtons from './CopyButtons';
import { LogsPreviewPanel } from '../LogsPreview';
import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Results = () => {
  const { state } = useAppState();
  const { t } = useLanguage();

  // 从状态获取日志数据
  const logs = state.logs || [];

  const handleExpandLogs = (logId) => {
    // TODO: 实现日志详情查看功能
    console.log('Expand log:', logId);
  };

  return (
    <>
      {(state.showResults || state.isTesting || state.keyResults.length > 0) ? (
        <>
          <StatsCards />
          
          {/* 日志预览面板 - 仅在启用日志功能时显示 */}
          {(state.logsEnabled || logs.length > 0) && (
            <LogsPreviewPanel 
              logs={logs}
              onExpandLogs={handleExpandLogs}
            />
          )}
          
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
    </>
  );
};

export default Results;
