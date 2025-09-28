import React, { useState, useEffect } from 'react';
import { getApiBalance } from '../../../services/api/base';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const KeyBalanceDisplay = ({ apiKey, apiType, proxyUrl }) => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [loading, setLoading] = useState(false);

  // 从keyResults中获取当前key的余额信息
  const keyResult = state.keyResults?.find(result => result.key === apiKey);
  const balanceInfo = keyResult?.balanceInfo;
  const balanceError = keyResult?.balanceError;

  const fetchBalance = async () => {
    if (!apiKey || !apiType) return;
    
    // 如果已经有余额信息，不重复查询
    if (balanceInfo || balanceError) return;

    setLoading(true);
    
    try {
      const result = await getApiBalance(apiKey, apiType, proxyUrl);
      
      // 更新keyResults中的余额信息
      dispatch({
        type: 'UPDATE_KEY_STATUS',
        payload: {
          key: apiKey,
          balanceInfo: result.success ? result : null,
          balanceError: result.success ? null : result.error
        }
      });
    } catch (err) {
      // 更新错误信息
      dispatch({
        type: 'UPDATE_KEY_STATUS',
        payload: {
          key: apiKey,
          balanceError: err.message
        }
      });
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
  
  if (balanceError) {
    return <div className="key-model">{t('balance.title')}: {t('balance.fetchFailed')}</div>;
  }
  
  if (balanceInfo) {
    return <div className="key-model">{t('balance.title')}: ¥{Number(balanceInfo.balance).toFixed(2)}</div>;
  }

  return null;
};

export default KeyBalanceDisplay;