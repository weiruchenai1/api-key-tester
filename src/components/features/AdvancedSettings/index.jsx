import React, { useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import ConcurrencyControl from '../ConcurrencyControl';
import RetryControl from '../RetryControl';
import PaidDetectionControl from '../PaidDetectionControl';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="card-base w-full max-w-2xl max-h-90vh overflow-y-auto m-md">
        <div className="flex items-center justify-between p-lg border-b">
          <h3 className="text-lg font-semibold text-primary">{t('advancedSettings')}</h3>
          <button
            className="btn-base btn-ghost btn-sm w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label={t('close')}
          >
            ×
          </button>
        </div>
        <div className="p-lg space-y-lg">
          <div className="border-b pb-lg">
            <ConcurrencyControl />
          </div>
          <div className="border-b pb-lg">
            <RetryControl />
          </div>
          <div>
            <PaidDetectionControl />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
