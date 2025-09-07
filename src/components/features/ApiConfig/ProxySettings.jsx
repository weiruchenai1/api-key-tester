import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { PROXY_EXAMPLES } from '../../../constants/api';
import styles from './ApiConfig.module.css';

const ProxySettings = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [inputValue, setInputValue] = useState(state.proxyUrl);

  useEffect(() => {
    setInputValue(state.proxyUrl);
  }, [state.proxyUrl]);

  const handleProxyChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    dispatch({ type: 'SET_PROXY_URL', payload: value });
  };

  return (
    <div className={styles.proxySelectorContainer}>
      <label htmlFor="proxyUrl">{t('proxyUrl')}</label>
      <div className={styles.proxyInputWrapper}>
        <input
          id="proxyUrl"
          type="text"
          className={styles.proxyInput}
          placeholder={PROXY_EXAMPLES[state.apiType]}
          value={inputValue}
          onChange={handleProxyChange}
        />
      </div>
      <small className="form-help">{t('proxyHelp')}</small>
    </div>
  );
};

export default ProxySettings;
