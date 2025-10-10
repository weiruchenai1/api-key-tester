import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { PROXY_EXAMPLES } from '../../../constants/api';

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
    <div className="space-y-sm">
      <label htmlFor="proxyUrl" className="text-sm font-medium text-primary">{t('proxyUrl')}</label>
      <div className="relative">
        <input
          id="proxyUrl"
          type="text"
          className="form-field"
          placeholder={PROXY_EXAMPLES[state.apiType]}
          value={inputValue}
          onChange={handleProxyChange}
        />
      </div>
    </div>
  );
};

export default ProxySettings;
