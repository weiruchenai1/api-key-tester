import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';

const CopyButtons = () => {
  const { t } = useLanguage();
  const { state } = useAppState();

  const handleCopy = (type) => {
    let keysToCopy = [];

    switch (type) {
      case 'all':
        keysToCopy = state.keyResults.map(k => k.key);
        break;
      case 'valid':
        keysToCopy = state.enablePaidDetection ?
          state.keyResults.filter(k => k.status === 'valid').map(k => k.key) :
          state.keyResults.filter(k => k.status === 'valid' || k.status === 'paid').map(k => k.key);
        break;
      case 'invalid':
        keysToCopy = state.keyResults.filter(k => k.status === 'invalid').map(k => k.key);
        break;
      case 'rate-limited':
        keysToCopy = state.keyResults.filter(k => k.status === 'rate-limited').map(k => k.key);
        break;
      case 'paid':
        keysToCopy = state.keyResults.filter(k => k.status === 'paid').map(k => k.key);
        break;
      case 'free':
        keysToCopy = state.keyResults.filter(k => k.status === 'valid').map(k => k.key);
        break;
      default:
        console.warn('Unknown copy type:', type);
        keysToCopy = [];
        break;
    }

    if (keysToCopy.length === 0) {
      alert(t('noKeysToCopy') || '没有可复制的密钥！');
      return;
    }

    navigator.clipboard.writeText(keysToCopy.join('\n')).then(() => {
      alert((t('keysCopied') || '已复制 {count} 个密钥到剪贴板！').replace('{count}', keysToCopy.length));
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = keysToCopy.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      alert((t('keysCopied') || '已复制 {count} 个密钥到剪贴板！').replace('{count}', keysToCopy.length));
    });
  };

  // 根据当前活跃标签页显示对应的复制按钮
  const getCopyButtonForTab = () => {
    switch (state.activeTab) {
      case 'all':
        return (
          <button className="copy-btn" onClick={() => handleCopy('all')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t('copyAll')}
          </button>
        );
      case 'valid':
        return (
          <button className="copy-btn" onClick={() => handleCopy('valid')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t('copyValid')}
          </button>
        );
      case 'paid':
        return (
          <button className="copy-btn paid" onClick={() => handleCopy('paid')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t('copyPaidKeys')}
          </button>
        );
      case 'invalid':
        return (
          <button className="copy-btn" onClick={() => handleCopy('invalid')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t('copyInvalid')}
          </button>
        );
      case 'rate-limited':
        return (
          <button className="copy-btn" onClick={() => handleCopy('rate-limited')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {t('copyRateLimited')}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="copy-buttons">
      {getCopyButtonForTab()}
    </div>
  );
};

export default CopyButtons;
