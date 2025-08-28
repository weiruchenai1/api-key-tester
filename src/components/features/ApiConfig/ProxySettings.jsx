import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useUserConfig } from '../../../hooks/useLocalStorage';
import { PROXY_EXAMPLES } from '../../../constants/api';
import './ApiConfig.module.css';

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
    <div className="input-group" ref={dropdownRef} style={{ position: 'relative' }}>
      <label htmlFor="proxyUrl">{t('proxyUrl')}</label>
      <div style={{ position: 'relative' }}>
        <input
          id="proxyUrl"
          type="text"
          className="form-control"
          placeholder={PROXY_EXAMPLES[state.apiType]}
          value={inputValue}
          onChange={handleProxyChange}
          onBlur={handleProxyBlur}
          onFocus={handleInputFocus}
          style={{ paddingRight: recentProxyUrls.length > 0 ? '30px' : '12px' }}
        />
        {recentProxyUrls.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '12px'
            }}
            title="查看历史记录"
          >
            ▼
          </button>
        )}
        
        {showDropdown && recentProxyUrls.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
              最近使用的代理地址
            </div>
            {recentProxyUrls.map((url, index) => (
              <div
                key={index}
                onClick={() => handleSelectRecentUrl(url)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  borderBottom: index < recentProxyUrls.length - 1 ? '1px solid #F3F4F6' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
