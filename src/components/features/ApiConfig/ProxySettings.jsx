import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useUserConfig } from '../../../hooks/useLocalStorage';
import { PROXY_EXAMPLES } from '../../../constants/api';
import styles from './ApiConfig.module.css';

const ProxySettings = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const { recentProxyUrls, addRecentProxyUrl } = useUserConfig();
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(state.proxyUrl);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setInputValue(state.proxyUrl);
  }, [state.proxyUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProxyChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    dispatch({ type: 'SET_PROXY_URL', payload: value });
  };

  const handleProxyBlur = () => {
    if (inputValue.trim() && inputValue !== state.proxyUrl) {
      addRecentProxyUrl(inputValue.trim());
    }
  };

  const handleSelectRecentUrl = (url) => {
    setInputValue(url);
    dispatch({ type: 'SET_PROXY_URL', payload: url });
    setShowDropdown(false);
    addRecentProxyUrl(url);
  };

  const handleInputFocus = () => {
    if (recentProxyUrls.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={styles.proxySelectorContainer} ref={dropdownRef}>
      <label htmlFor="proxyUrl">{t('proxyUrl')}</label>
      <div className={styles.proxyInputWrapper}>
        <input
          id="proxyUrl"
          type="text"
          className={styles.proxyInput}
          placeholder={PROXY_EXAMPLES[state.apiType]}
          value={inputValue}
          onChange={handleProxyChange}
          onBlur={handleProxyBlur}
          onFocus={handleInputFocus}
        />
        {recentProxyUrls.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={styles.dropdownButton}
            title="查看历史记录"
          >
            ▼
          </button>
        )}

        {showDropdown && recentProxyUrls.length > 0 && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownHeader}>
              最近使用的代理地址
            </div>
            {recentProxyUrls.map((url, index) => (
              <div
                key={index}
                onClick={() => handleSelectRecentUrl(url)}
                className={styles.dropdownItem}
              >
                {url}
              </div>
            ))}
          </div>
        )}
      </div>
      <small className="form-help">{t('proxyHelp')}</small>
    </div>
  );
};

export default ProxySettings;
