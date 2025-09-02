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
      case 'paid': return 'status-paid';
      case 'invalid': return 'status-invalid';
      case 'rate-limited': return 'status-rate-limited';
      case 'retrying': return 'status-retrying';
      case 'testing': return 'status-testing';
      default: return 'status-testing';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return t('statusValid') || '有效';
      case 'paid': return t('paidKeys') || '付费';
      case 'invalid': return t('statusInvalid') || '无效';
      case 'rate-limited': return t('statusRateLimit') || '速率限制';
      case 'retrying': return t('statusRetrying') || '重试中';
      case 'testing': return t('statusTesting') || '测试中';
      default: return status;
    }
  };

  const getLocalizedError = (error) => {
    if (!error) return '';

    const errorMappings = {
      'Rate Limited': t('rateLimited') || '速率限制',
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

  // 修复显示逻辑
  const getKeyStatusInfo = () => {
    // 如果是有效密钥且没有启用付费检测
    if (keyData.status === 'valid' && !state.enablePaidDetection) {
      return `有效密钥 (200)`;
    }

    // 如果是有效密钥且启用了付费检测但检测为免费密钥
    if (keyData.status === 'valid' && state.enablePaidDetection && keyData.isPaid === false) {
      return `免费密钥 (${keyData.cacheApiStatus || 429})`;
    }

    // 如果是付费密钥
    if (keyData.status === 'paid' && keyData.isPaid === true) {
      return `付费密钥 (${keyData.cacheApiStatus || 200})`;
    }

    // 其他情况返回null，不显示额外信息
    return null;
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
              重试: {keyData.retryCount}
            </div>
          )}
          {/* 修复后的状态信息显示 */}
          {getKeyStatusInfo() && (
            <div className="key-valid-info">
              {getKeyStatusInfo()}
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
  const { getItemHeight } = useVirtualization();
  const listRef = useRef(null);
  const containerRef = useRef(null);

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

  // 固定高度，与 CSS 中的 max-height 保持一致
  const listHeight = 350;

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

    return <EmptyState message={emptyMessages[state.activeTab]} />;
  }

  return (
    <div ref={containerRef} className="virtualized-list-container">
      <List
        ref={listRef}
        height={listHeight}
        itemCount={filteredKeys.length}
        itemSize={getItemSize}
        itemData={filteredKeys}
        overscanCount={3}
        width="100%"
        className="virtualized-list"
      >
        {KeyItem}
      </List>
    </div>
  );
};

// 确保正确导出默认组件
export default VirtualizedList;
