import React, { useState, useEffect } from 'react';
import { getApiBalance } from '../../../services/api/base';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './BalanceDisplay.module.css';

const BalanceDisplay = ({ apiKey, apiType, proxyUrl }) => {
  const { t } = useLanguage();
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    if (!apiKey || !apiType) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getApiBalance(apiKey, apiType, proxyUrl);
      if (result.success) {
        setBalanceInfo(result);
        setError(null);
      } else {
        setError(result.error);
        setBalanceInfo(null);
      }
    } catch (err) {
      setError(err.message);
      setBalanceInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 只有当apiType支持余额查询时才自动获取
    if (apiType === 'siliconcloud' && apiKey) {
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, apiType, proxyUrl]);

  // 如果不是支持余额查询的API类型，则不显示组件
  if (apiType !== 'siliconcloud') {
    return null;
  }

  return (
    <div className={styles.balanceDisplay}>
      <div className={styles.header}>
        <h3>{t('balance.title')}</h3>
        <button 
          onClick={fetchBalance} 
          disabled={loading || !apiKey}
          className={styles.refreshButton}
        >
          {loading ? t('balance.refreshing') : t('balance.refresh')}
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{t('balance.fetchFailed')}: {error}</span>
        </div>
      )}
      
      {balanceInfo && !error && (
        <div className={styles.balanceInfo}>
          <div className={styles.balanceItem}>
            <span className={styles.label}>{t('balance.accountBalance')}:</span>
            <span className={styles.value}>
              ¥{Number(balanceInfo.balance).toFixed(2)} {balanceInfo.currency}
            </span>
          </div>
          
          {balanceInfo.userInfo && (
            <div className={styles.userInfo}>
              {balanceInfo.userInfo.nickname && (
                <div className={styles.balanceItem}>
                  <span className={styles.label}>{t('balance.userNickname')}:</span>
                  <span className={styles.value}>{balanceInfo.userInfo.nickname}</span>
                </div>
              )}
              {balanceInfo.userInfo.email && (
                <div className={styles.balanceItem}>
                  <span className={styles.label}>{t('balance.email')}:</span>
                  <span className={styles.value}>{balanceInfo.userInfo.email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!balanceInfo && !error && !loading && apiKey && (
        <div className={styles.placeholder}>
          {t('balance.clickToRefresh')}
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;