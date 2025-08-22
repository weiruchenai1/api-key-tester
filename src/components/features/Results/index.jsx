import React from 'react';
import StatsCards from './StatsCards';
import ResultTabs from './ResultTabs';
import VirtualizedList from './VirtualizedList';
import ProgressBar from './ProgressBar';
import Loading from '../../common/Loading';
import CopyButtons from './CopyButtons';
import { useAppState } from '../../../contexts/AppStateContext';

const Results = () => {
  const { state } = useAppState();

  if (!state.showResults && !state.isTesting) {
    return null;
  }

  return (
    <div className="results-section">
      <ProgressBar />

      <Loading isVisible={state.isTesting && state.keyResults.length === 0} />

      <StatsCards />

      <ResultTabs />

      <div className="tab-content active">
        <VirtualizedList />
        <CopyButtons />
      </div>
    </div>
  );
};

export default Results;
