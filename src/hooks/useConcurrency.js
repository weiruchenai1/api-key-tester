import { useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';

export const useConcurrency = () => {
  const { state, dispatch } = useAppState();

  const updateConcurrency = useCallback((value) => {
    const concurrency = Math.max(1, Math.min(100, parseInt(value) || 1));
    dispatch({ type: 'SET_CONCURRENCY', payload: concurrency });
  }, [dispatch]);

  const setConcurrencyPreset = useCallback((preset) => {
    const presetMap = {
      slow: 1,
      normal: 5,
      fast: 10,
      ultra: 20
    };

    const value = presetMap[preset] || 5;
    updateConcurrency(value);
  }, [updateConcurrency]);

  return {
    concurrency: state.concurrency,
    updateConcurrency,
    setConcurrencyPreset
  };
};
