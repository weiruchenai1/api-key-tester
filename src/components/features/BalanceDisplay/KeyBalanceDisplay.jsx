import React, { useState, useEffect } from 'react';
import { getApiBalance } from '../../../services/api/base';
import { useLanguage } from '../../../hooks/useLanguage';

const KeyBalanceDisplay = ({ apiKey, apiType, proxyUrl }) => {
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

  // 根据状态返回相应的显示内容
  if (loading) {
    return <div className="key-model">{t('balance.title')}: {t('balance.refreshing')}</div>;
  }
  
  if (error) {
    return <div className="key-model">{t('balance.title')}: {t('balance.fetchFailed')}</div>;
  }
  
  if (balanceInfo) {
    return <div className="key-model">{t('balance.title')}: ¥{Number(balanceInfo.balance).toFixed(2)}</div>;
  }

  return null;
};

export default KeyBalanceDisplay;