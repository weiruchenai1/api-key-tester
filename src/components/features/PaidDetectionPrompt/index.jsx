import React, { useState } from 'react';
import { useUserConfig } from '../../../hooks/useLocalStorage';
import { useLanguage } from '../../../hooks/useLanguage';
import { PAID_DETECTION_KEYS } from '../../../constants/localStorage';
import styles from './PaidDetectionPrompt.module.css';

const PaidDetectionPrompt = ({ isOpen, onClose, onConfirm }) => {
  const { setEnablePaidDetection } = useUserConfig();
  const { t } = useLanguage();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = (enablePaidDetection) => {
    // 设置付费检测状态
    setEnablePaidDetection(enablePaidDetection);
    
    // 如果用户选择不再提示，保存到本地存储
    if (dontShowAgain) {
      localStorage.setItem(PAID_DETECTION_KEYS.GEMINI_PROMPT_DISABLED, 'true');
      localStorage.setItem(PAID_DETECTION_KEYS.GEMINI_DEFAULT_SETTING, enablePaidDetection.toString());
    }
    
    onConfirm(enablePaidDetection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{t('paidDetectionDialog.title')}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          
          <div className={styles.message}>
            <p className={styles.description}>
              {t('paidDetectionDialog.description')}
            </p>
            <p className={styles.warning}>
              {t('paidDetectionDialog.warning')}
            </p>
          </div>

          <div className={styles.checkbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxText}>{t('paidDetectionDialog.dontShowAgain')}</span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn} 
            onClick={() => handleConfirm(false)}
          >
            {t('paidDetectionDialog.cancelButton')}
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={() => handleConfirm(true)}
          >
            {t('paidDetectionDialog.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaidDetectionPrompt;
