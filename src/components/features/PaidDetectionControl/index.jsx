import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import styles from './PaidDetectionControl.module.css';

const PaidDetectionControl = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();

  const handleTogglePaidDetection = () => {
    const newValue = !state.enablePaidDetection;
    dispatch({ type: 'SET_PAID_DETECTION', payload: newValue });
    
    // 同时更新本地存储
    localStorage.setItem('enablePaidDetection', JSON.stringify(newValue));
    
    // 如果用户之前设置了不再提示，更新默认设置
    const promptDisabled = localStorage.getItem('geminiPaidDetectionPromptDisabled') === 'true';
    if (promptDisabled) {
      localStorage.setItem('geminiPaidDetectionDefault', newValue.toString());
    }
  };

  // 重置弹窗提示设置
  const handleResetPrompt = () => {
    localStorage.removeItem('geminiPaidDetectionPromptDisabled');
    localStorage.removeItem('geminiPaidDetectionDefault');
    alert('弹窗提示设置已重置，下次选择Gemini时将重新询问');
  };

  return (
    <div className={styles.paidDetectionControl}>
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Gemini付费检测
        </label>
        <div className={styles.settingContent}>
          <div className={styles.switchContainer}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={state.enablePaidDetection}
                onChange={handleTogglePaidDetection}
                className={styles.switchInput}
              />
              <span className={styles.switchSlider}></span>
            </label>
            <span className={styles.switchLabel}>
              {state.enablePaidDetection ? '已启用' : '已禁用'}
            </span>
          </div>
          <p className={styles.settingDescription}>
            启用后将使用Cache API检测Gemini密钥的付费功能，会消耗额外配额
          </p>
        </div>
      </div>

      {/* 弹窗设置重置 */}
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          弹窗提示设置
        </label>
        <div className={styles.settingContent}>
          <button 
            className={styles.resetButton}
            onClick={handleResetPrompt}
          >
            重置弹窗提示
          </button>
          <p className={styles.settingDescription}>
            重置后，下次选择Gemini时将重新显示付费检测询问弹窗
          </p>
        </div>
      </div>

      {/* 当前状态显示 */}
      {state.apiType === 'gemini' && (
        <div className={styles.statusInfo}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>当前API类型:</span>
            <span className={styles.statusValue}>Google Gemini</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>付费检测状态:</span>
            <span className={`${styles.statusValue} ${state.enablePaidDetection ? styles.enabled : styles.disabled}`}>
              {state.enablePaidDetection ? '✅ 已启用' : '❌ 已禁用'}
            </span>
          </div>
          {state.enablePaidDetection && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>固定模型:</span>
              <span className={styles.statusValue}>gemini-2.5-flash</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaidDetectionControl;
