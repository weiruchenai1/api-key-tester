import React, { useState } from 'react';
import { useUserConfig } from '../../../hooks/useLocalStorage';
import styles from './PaidDetectionPrompt.module.css';

const PaidDetectionPrompt = ({ isOpen, onClose, onConfirm }) => {
  const { setEnablePaidDetection } = useUserConfig();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = (enablePaidDetection) => {
    // 设置付费检测状态
    setEnablePaidDetection(enablePaidDetection);
    
    // 如果用户选择不再提示，保存到本地存储
    if (dontShowAgain) {
      localStorage.setItem('geminiPaidDetectionPromptDisabled', 'true');
      localStorage.setItem('geminiPaidDetectionDefault', enablePaidDetection.toString());
    }
    
    onConfirm(enablePaidDetection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>测试Gemini付费Key</h3>
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
              如果要测试Gemini的付费Key，需要消耗一定的Token来检测Key是否有访问付费功能的能力。
            </p>
            <p className={styles.warning}>
              ⚠️ 付费检测会使用Cache API，可能会消耗额外的API配额。
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
              <span className={styles.checkboxText}>不再提示此消息（可在高级设置中更改）</span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn} 
            onClick={() => handleConfirm(false)}
          >
            否，不检测付费功能
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={() => handleConfirm(true)}
          >
            是，启用付费检测
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaidDetectionPrompt;
