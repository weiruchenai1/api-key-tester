import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import { useApiTester } from '../../../hooks/useApiTester';
import { deduplicateAndCleanKeys } from '../../../utils/keyProcessor';
import { getLogCollector } from '../../../utils/logCollector';
import { showToast } from '../../../utils/toast.jsx';
import Button from '../../common/Button';

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
      showToast.error(t('enterApiKeys') || '请输入API密钥！');
      return;
    }

    if (!state.model.trim()) {
      showToast.error(t('selectModel') || '请选择或输入模型名！');
      return;
    }

    const rawKeys = state.apiKeysText.split('\n').filter(key => key.trim());
    if (rawKeys.length === 0) {
      showToast.error(t('enterValidKeys') || '请输入有效的API密钥！');
      return;
    }

    // 自动去重
    const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);

    if (duplicates.length > 0) {
      const message = (t('duplicatesRemoved') || '发现 {duplicates} 个重复密钥，已自动去除。将测试 {unique} 个唯一密钥。')
        .replace('{duplicates}', duplicates.length)
        .replace('{unique}', uniqueKeys.length);
      showToast.info(message);
    }

    await startTesting(uniqueKeys);
  };

  const handleDedupeKeys = () => {
    if (state.isTesting) {
      showToast.warning(t('cannotDedupeWhileTesting') || '测试正在进行中，无法去重！');
      return;
    }

    if (!state.apiKeysText.trim()) {
      showToast.error(t('enterApiKeysFirst') || '请先输入API密钥！');
      return;
    }

    const rawKeys = state.apiKeysText.split('\n').filter(key => key.trim());
    const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(rawKeys);

    if (duplicates.length > 0) {
      dispatch({ type: 'SET_API_KEYS_TEXT', payload: uniqueKeys.join('\n') });
      const message = (t('dedupeSuccess') || '已去除 {removed} 个重复密钥，保留 {kept} 个唯一密钥。')
        .replace('{removed}', duplicates.length)
        .replace('{kept}', uniqueKeys.length);
      showToast.success(message);
    } else {
      showToast.info(t('noDuplicatesFound') || '未发现重复密钥。');
    }
  };

  const handleClear = () => {
    if (state.isTesting) {
      showToast.warning(t('cannotClearWhileTesting') || '测试正在进行中，无法清空！');
      return;
    }

    dispatch({ type: 'CLEAR_ALL' });
    const collector = getLogCollector && getLogCollector();
    if (collector && typeof collector.clearLogs === 'function') {
      collector.clearLogs();
    }
    showToast.success(t('cleared') || '已清空所有内容。');
  };

  return (
    <div className="space-y-md">
      <div className="controls-container">
        <Button
          variant={state.isTesting ? 'danger' : 'primary'}
          size="large"
          onClick={handleStartTest}
          className="btn-fixed-lg flex items-center gap-xs"
        >
          {state.isTesting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              {t('cancelTest')}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              {t('startTest')}
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          size="large"
          onClick={handleDedupeKeys}
          disabled={state.isTesting}
          className="btn-fixed-lg flex items-center gap-xs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {t('dedupeKeys')}
        </Button>

        <Button
          variant="secondary"
          size="large"
          onClick={handleClear}
          disabled={state.isTesting}
          className="btn-fixed-lg flex items-center gap-xs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6" />
            <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {t('clear')}
        </Button>
      </div>
    </div>
  );
};

export default Controls;
