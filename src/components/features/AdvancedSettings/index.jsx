import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import ConcurrencyControl from '../ConcurrencyControl';
import RetryControl from '../RetryControl';
import PaidDetectionControl from '../PaidDetectionControl';
import styles from './AdvancedSettings.module.css';

const AdvancedSettings = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{t('advancedSettings')}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('close')}
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.settingItem}>
            <ConcurrencyControl />
          </div>
          <div className={styles.settingItem}>
            <RetryControl />
          </div>
          <div className={styles.settingItem}>
            <PaidDetectionControl />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
