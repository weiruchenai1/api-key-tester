import React, { useMemo, useRef, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useVirtualization } from '../../../hooks/useVirtualization';
import KeyBalanceDisplay from '../BalanceDisplay/KeyBalanceDisplay';
import StatusBadge from '../../common/StatusBadge';

const KeyItem = ({ index, style, data }) => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const keyData = data[index];
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  if (!keyData) {
    return <div style={style} className="key-item loading-item">{t('ui.loading')}</div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'valid': return 'status-valid';
      case 'paid': return 'status-paid';
      case 'invalid': return 'status-invalid';
      case 'rate-limited': return 'status-rate-limited';
      case 'retrying': return 'status-retrying';
      case 'testing': return 'status-testing';
      default: return 'status-unknown';
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

    // 如果错误是翻译键，直接使用翻译
    if (error.startsWith('errorMessages.')) {
      return t(error) || error;
    }

    // 直接翻译显示
    return error;
  };

  // 修复显示逻辑
  const getKeyStatusInfo = () => {
    // 如果是有效密钥且没有启用付费检测
    if (keyData.status === 'valid' && !state.enablePaidDetection) {
      return `${t('keyStatus.validKey')} (200)`;
    }

    // 如果是有效密钥且启用了付费检测但检测为免费密钥
    if (keyData.status === 'valid' && state.enablePaidDetection && keyData.isPaid === false) {
      return `${t('keyStatus.freeKey')} (${keyData.cacheApiStatus || 429})`;
    }

    // 如果是付费密钥
    if (keyData.status === 'paid' && keyData.isPaid === true) {
      return `${t('keyStatus.paidKey')} (${keyData.cacheApiStatus || 200})`;
    }

    // 如果是无效密钥
    if (keyData.status === 'invalid') {
      return `${t('statusInvalid') || '无效密钥'} (${keyData.statusCode || 400})`;
    }

    // 如果是速率限制
    if (keyData.status === 'rate-limited') {
      return `${t('statusRateLimit') || '速率限制'} (${keyData.statusCode || 429})`;
    }

    // 如果是测试中
    if (keyData.status === 'testing') {
      return `${t('statusTesting') || '测试中'}`;
    }

    // 如果是重试中
    if (keyData.status === 'retrying') {
      return `${t('statusRetrying') || '重试中'} (${keyData.retryCount || 0})`;
    }

    // 其他情况返回null，不显示额外信息
    return null;
  };

  const handleOpenLogs = () => {
    dispatch({ type: 'OPEN_LOG_MODAL', payload: keyData.key });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenLogs();
    }
  };

  // 格式化密钥显示 - 参考 new-api 的遮罩规则
  const formatKey = (key, isVisible) => {
    if (isVisible) {
      // 显示完整密钥
      return key;
    } else {
      // 显示遮罩版本：前4位 + 10个星号 + 后4位
      if (key.length <= 8) return key;
      return key.substring(0, 4) + '**********' + key.substring(key.length - 4);
    }
  };

  // 回退的复制方法（用于不支持 Clipboard API 的浏览器）
  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    Object.assign(textArea.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px'
    });
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('复制失败:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // 复制密钥到剪贴板
  const handleCopyKey = (e) => {
    e.stopPropagation();

    const text = keyData.key;
    // 优先使用现代 Clipboard API，如果不支持则回退到 execCommand
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // 如果 Clipboard API 失败（如权限问题），使用回退方案
        fallbackCopy(text);
      });
    } else {
      // 浏览器不支持 Clipboard API，使用回退方案
      fallbackCopy(text);
    }
  };

  // 切换密钥显示/隐藏
  const handleToggleKeyVisibility = (e) => {
    e.stopPropagation();
    setIsKeyVisible(!isKeyVisible);
  };

  return (
    <div style={style} className="key-item-wrapper">
      <div className={`key-item-horizontal ${getStatusClass(keyData.status)}`}>
        {/* 左侧：状态指示器 */}
        <div className="key-status-indicator">
          <span className="key-status-text">{getStatusText(keyData.status)}</span>
        </div>

        {/* 中间：密钥显示区域 - 完全参考 new-api 的 Input 组件设计 */}
        <div className="key-display-container">
          {/* 模拟 Semi Design Input 组件的结构 */}
          <div className="semi-input-wrapper semi-input-wrapper-small">
            {/* 可滚动的密钥显示容器 */}
            <div className="semi-input-scrollable">
              <span className="semi-input-text">{formatKey(keyData.key, isKeyVisible)}</span>
            </div>

            {/* Suffix 区域 - 操作按钮 */}
            <div className="semi-input-suffix">
              <button
                className="semi-button semi-button-borderless semi-button-small semi-button-tertiary"
                onClick={handleToggleKeyVisibility}
                aria-label={isKeyVisible ? "Hide key" : "Show key"}
                title={isKeyVisible ? t('hideKey') || "隐藏密钥" : t('showKey') || "显示密钥"}
              >
                {isKeyVisible ? (
                  // IconEyeClosed - 睁眼
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  // IconEyeOpened - 闭眼
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
              <button
                className="semi-button semi-button-borderless semi-button-small semi-button-tertiary"
                onClick={handleCopyKey}
                aria-label="Copy key"
                title={t('copyKey') || "复制密钥"}
              >
                {/* IconCopy */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 状态信息和余额显示 - 点击打开日志 */}
          <button
            className="key-info-row key-info-clickable"
            onClick={handleOpenLogs}
            onKeyDown={handleKeyDown}
            aria-label={t('openLogs') || 'Open logs for this key'}
          >
            {getKeyStatusInfo() && (
              <span className="key-status-info">{getKeyStatusInfo()}</span>
            )}
            {/* 余额显示 */}
            {(keyData.status === 'valid' || keyData.status === 'paid') && state.apiType === 'siliconcloud' && (
              <KeyBalanceDisplay
                apiKey={keyData.key}
                apiType={state.apiType}
                proxyUrl={state.proxyUrl}
              />
            )}
          </button>
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
  const getItemSize = () => {
    return getItemHeight();
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
      'rate-limited': t('noRateLimitedKeys') || '暂无速率限制密钥',
      paid: t('noPaidKeys') || '暂无付费密钥'
    };

    return (
      <div ref={containerRef} className="virtualized-list-container">
        <EmptyState message={emptyMessages[state.activeTab]} />
      </div>
    );
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