import React from 'react';
import StatsCards from './StatsCards';
import ResultTabs from './ResultTabs';
import VirtualizedList from './VirtualizedList';
import Loading from '../../common/Loading';
import CopyButtons from './CopyButtons';
import { useAppState } from '../../../contexts/AppStateContext';

const Results = () => {
  const { state } = useAppState();

  return (
    <div className="results-container">
      {(state.showResults || state.isTesting || state.keyResults.length > 0) ? (
        <>
          <StatsCards />

          {/* 密钥显示区域 - 包装在卡片中 */}
          <div className="function-card results-card">
            <ResultTabs />
            <div className="results-content">
              <VirtualizedList />
            </div>
            <CopyButtons />
          </div>
        </>
      ) : (
        <div className="function-card">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">检测结果将显示在这里</div>
          </div>
        </div>
      )}

      <Loading isVisible={state.isTesting && state.keyResults.length === 0} />
    </div>
  );
};

export default Results;
