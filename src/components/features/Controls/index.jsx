import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useApiTester } from '../../../hooks/useApiTester';
import { deduplicateAndCleanKeys } from '../../../utils/keyProcessor';
import styles from './Controls.module.css';

const Controls = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const { startTesting, cancelTesting } = useApiTester();

  const handleStartTest = async () => {
    if (state.isTesting) {
      cancelTesting();
      return;
    }

    if (!state.apiKeysText.trim()) {
      alert(t('enterApiKeys') || '请输入API密钥！');
      return;
    }

    if (!state.model.trim()) {
      alert(t('selectModel') || '请选择或输入模型名！');
      return;
    }

    const rawKeys = state.apiKeysText.split('\n').filter(key => key.trim());
    if (rawKeys.length === 0) {
      alert(t('enterValidKeys') || '请输入有效的API密钥！');
      return;
    }

    // 自动去重
    const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);

    if (duplicates.length > 0) {
      const message = (t('duplicatesRemoved') || '发现 {duplicates} 个重复密钥，已自动去除。将测试 {unique} 个唯一密钥。')
        .replace('{duplicates}', duplicates.length)
        .replace('{unique}', uniqueKeys.length);
      alert(message);
    }

    await startTesting(uniqueKeys);
  };

  const handleDedupeKeys = () => {
    if (state.isTesting) {
      alert(t('cannotDedupeWhileTesting') || '测试正在进行中，无法去重！');
      return;
    }

    if (!state.apiKeysText.trim()) {
      alert(t('enterApiKeysFirst') || '请先输入API密钥！');
      return;
    }

    const rawKeys = state.apiKeysText.split('\n').filter(key => key.trim());
    const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);

    if (duplicates.length > 0) {
      dispatch({ type: 'SET_API_KEYS_TEXT', payload: uniqueKeys.join('\n') });
      const message = (t('dedupeSuccess') || '已去除 {removed} 个重复密钥，保留 {kept} 个唯一密钥。')
        .replace('{removed}', duplicates.length)
        .replace('{kept}', uniqueKeys.length);
      alert(message);
    } else {
      alert(t('noDuplicatesFound') || '未发现重复密钥。');
    }
  };

  const handleClear = () => {
    if (state.isTesting) {
      alert(t('cannotClearWhileTesting') || '测试正在进行中，无法清空！');
      return;
    }

    dispatch({ type: 'CLEAR_ALL' });
    alert(t('cleared') || '已清空所有内容。');
  };

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.mainActionButtons}>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${styles.startTestBtn}`}
          onClick={handleStartTest}
        >
          {state.isTesting ? (
            <>⏹️ {t('cancelTest')}</>
          ) : (
            <>▶️ {t('startTest')}</>
          )}
        </button>

        <button
          className={`${styles.btn} ${styles.btnSecondary} ${styles.dedupeBtn}`}
          onClick={handleDedupeKeys}
          disabled={state.isTesting}
        >
          🔄 {t('dedupeKeys')}
        </button>

        <button
          className={`${styles.btn} ${styles.btnSecondary} ${styles.clearBtn}`}
          onClick={handleClear}
          disabled={state.isTesting}
        >
          🗑️ {t('clear')}
        </button>
      </div>
    </div>
  );
};

export default Controls;
