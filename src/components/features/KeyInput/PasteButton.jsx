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
      📋
    </button>
  );
};

export default PasteButton;
