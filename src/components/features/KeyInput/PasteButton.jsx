import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import styles from './KeyInput.module.css';

const PasteButton = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [isPasting, setIsPasting] = useState(false);

  const handlePaste = async () => {
    if (state.isTesting || isPasting) return;

    setIsPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        const currentValue = state.apiKeysText;
        const newValue = currentValue.trim()
          ? currentValue + '\n' + text
          : text;

        dispatch({ type: 'SET_API_KEYS_TEXT', payload: newValue });
      }
    } catch (err) {
      console.error('无法读取剪贴板内容:', err);
      dispatch({
        type: 'SHOW_MESSAGE',
        payload: {
          type: 'error',
          message: t('clipboardError')
        }
      });
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <button
      className={`${styles.controlBtn} ${styles.pasteBtn}`}
      onClick={handlePaste}
      disabled={state.isTesting}
      title={t('paste')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="m16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </svg>
    </button>
  );
};

export default PasteButton;
