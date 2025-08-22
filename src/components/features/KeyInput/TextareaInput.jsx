import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const TextareaInput = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleKeysChange = (e) => {
    dispatch({ type: 'SET_API_KEYS_TEXT', payload: e.target.value });
  };

  const handleKeyDown = (e) => {
    // 防止测试过程中意外清空输入
    if (state.isTesting && (e.key === 'Backspace' || e.key === 'Delete')) {
      if (state.apiKeysText === '' || (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        return;
      }
    }
  };

  return (
    <textarea
      id="apiKeys"
      className="form-control textarea"
      placeholder={t('apiKeysPlaceholder')}
      value={state.apiKeysText}
      onChange={handleKeysChange}
      onKeyDown={handleKeyDown}
      disabled={state.isTesting}
    />
  );
};

export default TextareaInput;
