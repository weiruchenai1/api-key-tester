import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const StatsCards = () => {
  const { t } = useLanguage();
  const { state } = useAppState();

  const stats = [
    {
      key: 'total',
      value: state.keyResults.length,
      className: 'total'
    },
    {
      key: 'valid',
      value: state.keyResults.filter(k => k.status === 'valid').length,
      className: 'valid'
    },
    {
      key: 'invalid',
      value: state.keyResults.filter(k => k.status === 'invalid').length,
      className: 'invalid'
    },
    {
      key: 'rateLimited',
      value: state.keyResults.filter(k => k.status === 'rate-limited').length,
      className: 'rate-limited'
    },
    {
      key: 'testing',
      value: state.keyResults.filter(k => ['testing', 'pending'].includes(k.status)).length,
      className: 'testing'
    },
    {
      key: 'retrying',
      value: state.keyResults.filter(k => k.status === 'retrying').length,
      className: 'retrying'
    }
  ];

  return (
    <div className="stats">
      {stats.map(stat => (
        <div key={stat.key} className="stat-card">
          <div className={`stat-number ${stat.className}`}>
            {stat.value}
          </div>
          <div className="stat-label">
            {t(stat.key)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
