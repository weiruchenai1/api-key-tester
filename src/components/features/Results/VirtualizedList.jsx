import React, { useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useVirtualization } from '../../../hooks/useVirtualization';

const KeyItem = ({ index, style, data }) => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const keyData = data[index];

  if (!keyData) {
    return <div style={style} className="key-item loading-item">Loading...</div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'valid': return 'status-valid';
      case 'paid': return state.enablePaidDetection ? 'status-paid' : 'status-valid';
      case 'invalid': return 'status-invalid';
      case 'rate-limited': return 'status-rate-limited';
      case 'retrying': return 'status-retrying';
      case 'testing': return 'status-testing';
      default: return 'status-testing';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return t('statusValid');
      case 'paid': return state.enablePaidDetection ? (t('paidKeys') || '付费Key') : t('statusValid');
      case 'invalid': return t('statusInvalid');
      case 'rate-limited': return t('statusRateLimit');
      case 'retrying': return t('statusRetrying');
      case 'testing': return t('statusTesting');
      default: return status;
    }
  };

  const getLocalizedError = (error) => {
    if (!error) return '';

    const errorMappings = {
      'Rate Limited': t('rateLimited'),
      '认证失败': t('authFailed') || '认证失败',
      '权限不足': t('permissionDenied') || '权限不足',
      '网络连接失败': t('networkFailed') || '网络连接失败'
    };

    for (const [key, value] of Object.entries(errorMappings)) {
      if (error.includes(key)) {
        return error.replace(key, value);
      }
    }

    return error;
  };

  return (
    <div style={style} className="key-item-wrapper">
      <div className="key-item">
        <div className="key-content">
          <div className="key-text">{keyData.key}</div>
          {keyData.model && (
            <div className="key-model">Model: {keyData.model}</div>
          )}
          {keyData.error && (
            <div className={`key-error ${keyData.status === 'rate-limited' ? 'rate-limited-error' : ''}`}>
              {getLocalizedError(keyData.error)}
            </div>
          )}
          {keyData.retryCount > 0 && (
            <div className="key-retry">
              {t('retry') || '重试'}: {keyData.retryCount}
            </div>
          )}
          {(keyData.status === 'valid' || keyData.status === 'paid') && !keyData.isPaid && (
            <div className="key-valid-info">
              {state.enablePaidDetection && keyData.cacheApiStatus ? 
                `${t('freeKey')} (${keyData.cacheApiStatus})` : 
                `${t('validKey')} (${keyData.basicApiStatus || 200})`}
            </div>
          )}
        </div>
        <div className={`key-status ${getStatusClass(keyData.status)}`}>
          {getStatusText(keyData.status)}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <div className="empty-icon">📭</div>
    <div className="empty-text">{message}</div>
  </div>
);

const VirtualizedList = () => {
  const { t } = useLanguage();
  const { state } = useAppState();
  const { getListHeight, getItemHeight } = useVirtualization();
  const listRef = useRef(null);

  const filteredKeys = useMemo(() => {
    switch (state.activeTab) {
      case 'valid':
        return state.enablePaidDetection ? 
          state.keyResults.filter(k => k.status === 'valid') :
          state.keyResults.filter(k => k.status === 'valid' || k.status === 'paid');
      case 'invalid':
        return state.keyResults.filter(k => k.status === 'invalid');
      case 'rate-limited':
        return state.keyResults.filter(k => k.status === 'rate-limited');
      case 'paid':
        return state.keyResults.filter(k => k.status === 'paid');
      default:
        return state.keyResults;
    }
  }, [state.keyResults, state.activeTab, state.enablePaidDetection]);

  const listHeight = getListHeight();

  // 创建一个函数来获取每个项目的高度
  const getItemSize = (index) => {
    return getItemHeight(filteredKeys[index]);
  };

  // 当数据变化时重置虚拟化缓存
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [filteredKeys]);

  if (filteredKeys.length === 0) {
    const emptyMessages = {
      all: t('noKeys') || '暂无密钥',
      valid: t('noValidKeys') || '暂无有效密钥',
      invalid: t('noInvalidKeys') || '暂无无效密钥',
      'rate-limited': t('noRateLimitedKeys') || '暂无速率限制密钥'
    };

    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <div className="empty-text">{emptyMessages[state.activeTab]}</div>
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={listHeight}
      itemCount={filteredKeys.length}
      itemSize={getItemSize}
      itemData={filteredKeys}
      overscanCount={5}
      width="100%"
      className="virtualized-list"
    >
      {KeyItem}
    </List>
  );
};

export default VirtualizedList;
