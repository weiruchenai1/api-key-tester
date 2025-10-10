import React, { useEffect } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import ConcurrencyControl from '../ConcurrencyControl';
import RetryControl from '../RetryControl';
import PaidDetectionControl from '../PaidDetectionControl';
import LogDisplayControl from '../LogDisplayControl';
import IconButton from '../../common/IconButton';
import Card from '../../common/Card';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 9999}} onClick={handleOverlayClick}>
      <Card 
        variant="base" 
        padding="none"
        className="w-full max-w-2xl max-h-90vh overflow-y-auto m-md"
      >
        <div className="flex items-center justify-between p-lg border-b">
          <h3 className="text-lg font-semibold text-primary">{t('advancedSettings')}</h3>
          <IconButton
            icon="×"
            onClick={onClose}
            variant="ghost"
            size="small"
            className="w-8 h-8 flex items-center justify-center"
            aria-label={t('close')}
          />
        </div>
        <div className="p-lg space-y-lg">
          <div className="border-b pb-lg">
            <ConcurrencyControl />
          </div>
          <div className="border-b pb-lg">
            <RetryControl />
          </div>
          <div className="border-b pb-lg">
            <LogDisplayControl />
          </div>
          <div>
            <PaidDetectionControl />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdvancedSettings;
