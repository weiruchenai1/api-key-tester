import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const PasteButton = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [isPasting, setIsPasting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      onClick={handlePaste}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={t('paste')}
      style={{
        position: 'absolute',
        top: '8px',
        right: '16px',
        zIndex: 10,
        cursor: state.isTesting ? 'not-allowed' : 'pointer',
        opacity: state.isTesting ? 0.5 : 1,
        transform: isHovered && !state.isTesting ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease, opacity 0.2s ease'
      }}
    >
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
    </svg>
  );
};

export default PasteButton;
