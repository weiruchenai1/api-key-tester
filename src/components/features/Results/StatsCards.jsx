import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const StatsCards = () => {
  const { t } = useLanguage();
  const { state } = useAppState();

  // 第一行：主要统计数据（包括付费密钥）
  const mainStats = [
    {
      key: 'total',
      value: state.keyResults.length,
      className: 'total'
    },
    {
      key: 'valid',
      value: state.enablePaidDetection ?
        state.keyResults.filter(k => k.status === 'valid').length :
        state.keyResults.filter(k => k.status === 'valid' || k.status === 'paid').length,
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
    }
  ];

  // 检查是否需要显示付费密钥统计
  const hasPaidDetection = state.apiType === 'gemini' && state.enablePaidDetection;

  // 如果启用了Gemini付费检测，直接添加付费密钥统计到主统计中
  if (hasPaidDetection) {
    mainStats.push({
      key: 'paidKeys',
      value: state.keyResults.filter(k => k.status === 'paid').length,
      className: 'paid'
    });
  }

  // 第二行状态（测试相关）
  const testingStats = [
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
    <div className="stats-container">
      {/* 第一行：主要统计（包含付费密钥） */}
      <div className={`stats ${!hasPaidDetection ? 'no-paid-detection' : ''}`}>
        {mainStats.map(stat => (
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

      {/* 第二行：测试状态（只在有数据时显示） */}
      {(testingStats[0].value > 0 || testingStats[1].value > 0) && (
        <div className="stats testing-stats">
          {testingStats.map(stat => (
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
      )}
    </div>
  );
};

export default StatsCards;
