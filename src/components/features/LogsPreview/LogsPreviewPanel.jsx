import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import Card from '../../common/Card';
import EmptyState from '../../common/EmptyState';

const LogsPreviewPanel = ({ logs = [], onExpandLogs }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return date.toLocaleDateString();
  };

  // 脱敏API密钥
  const maskApiKey = (key) => {
    if (!key || typeof key !== 'string') return 'Unknown';
    return key;
  };

  // 过滤和搜索日志
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (filter === 'errors') {
      filtered = filtered.filter(log => log.status === 'error');
    } else if (filter === 'success') {
      filtered = filtered.filter(log => log.status === 'success');
    }
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.keyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.apiType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.error?.message || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [logs, filter, searchTerm]);

  // 紧凑模式显示的日志
  const compactLogs = useMemo(() => {
    const errorLogs = logs.filter(log => log.status === 'error').slice(0, 3);
    if (errorLogs.length > 0) return errorLogs;
    return logs.slice(0, 3);
  }, [logs]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClearLogs = () => {
    if (onExpandLogs) {
      onExpandLogs('clear');
    }
  };

  const renderLogItem = (log, isCompact = false) => {
    const errorMessage = log.error?.message || '';
    const truncatedError = isCompact && errorMessage.length > 50 
      ? errorMessage.substring(0, 50) + '...' 
      : errorMessage;

    return (
      <div key={log.id} className={`p-sm mb-xs border-l-4 ${
        log.status === 'error' ? 'border-error' : 'border-success'
      }`}>
        <div className="flex items-center justify-between mb-xs">
          <div className="flex items-center gap-sm text-xs">
            <span className="text-tertiary">{formatTime(log.timestamp)}</span>
            <span className="badge-base bg-secondary">{log.apiType}</span>
            <span className="text-secondary font-mono">{maskApiKey(log.keyId)}</span>
          </div>
          <span className={`badge-base ${
            log.status === 'success' ? 'badge-success' : 'badge-error'
          }`}>
            {log.status === 'success' ? t('success') : t('error')}
          </span>
        </div>
        {log.status === 'error' && truncatedError && (
          <div className="text-sm text-error bg-error p-sm rounded mt-xs">
            {truncatedError}
          </div>
        )}
        {log.status === 'success' && isCompact && (
          <div className="text-sm text-success bg-success p-sm rounded mt-xs">
            {t('testSuccess')}
          </div>
        )}
      </div>
    );
  };

  if (logs.length === 0) {
    return (
      <Card variant="base" padding="md" className="mb-md">
        <div className="flex items-center justify-between mb-md">
          <h4 className="text-base font-semibold text-primary">{t('recentLogs')}</h4>
        </div>
        <EmptyState message={t('noLogsYet')} />
      </Card>
    );
  }

  return (
    <div className={`card-base mb-md transition-all overflow-hidden ${
      isExpanded ? 'max-h-96' : 'max-h-32'
    }`}>
      <div className="flex items-center justify-between p-md border-b bg-secondary">
        <h4 className="text-base font-semibold text-primary">
          {isExpanded ? t('allLogs') : t('recentLogs')}
        </h4>
        <div className="flex items-center gap-sm">
          {isExpanded && (
            <>
              <div className="flex gap-xs">
                <button
                  className={`btn-base btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter('all')}
                >
                  {t('allLogs')}
                </button>
                <button
                  className={`btn-base btn-sm ${filter === 'errors' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter('errors')}
                >
                  {t('errorsOnly')}
                </button>
                <button
                  className={`btn-base btn-sm ${filter === 'success' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter('success')}
                >
                  {t('successOnly')}
                </button>
              </div>
              <button
                className="btn-base btn-sm btn-ghost"
                onClick={handleClearLogs}
                title={t('clearLogs')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                </svg>
              </button>
            </>
          )}
          <button
            className="btn-base btn-sm btn-ghost"
            onClick={handleToggleExpand}
            title={isExpanded ? t('collapse') : t('expandAll')}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-md border-b">
          <input
            type="text"
            placeholder={t('searchLogs')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-field"
          />
        </div>
      )}

      <div className="p-md overflow-y-auto" style={{ maxHeight: '280px' }}>
        {isExpanded ? (
          filteredLogs.length > 0 ? (
            filteredLogs.map(log => renderLogItem(log, false))
          ) : (
            <EmptyState 
              message={searchTerm ? t('noMatchingLogs') : 
                      filter === 'errors' ? t('noRecentErrors') : t('noLogsYet')}
            />
          )
        ) : (
          compactLogs.length > 0 ? (
            compactLogs.map(log => renderLogItem(log, true))
          ) : (
            <EmptyState message={t('noRecentErrors')} />
          )
        )}
      </div>
    </div>
  );
};

export default LogsPreviewPanel;
