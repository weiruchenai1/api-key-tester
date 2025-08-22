import React, { useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { PROXY_EXAMPLES } from '../../../constants/api';
import './ApiConfig.module.css';

const ProxySettings = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  useEffect(() => {
    // 根据API类型更新代理输入框的placeholder
    const placeholder = PROXY_EXAMPLES[state.apiType] || '';
    dispatch({ type: 'SET_PROXY_PLACEHOLDER', payload: placeholder });
  }, [state.apiType, dispatch]);

  const handleProxyChange = (e) => {
    dispatch({ type: 'SET_PROXY_URL', payload: e.target.value });
  };

  return (
    <div className="input-group">
      <label htmlFor="proxyUrl">{t('proxyUrl')}</label>
      <input
        id="proxyUrl"
        type="text"
        className="form-control"
        placeholder={PROXY_EXAMPLES[state.apiType]}
        value={state.proxyUrl}
        onChange={handleProxyChange}
      />
      <small className="form-help">{t('proxyHelp')}</small>
    </div>
  );
};

export default ProxySettings;
