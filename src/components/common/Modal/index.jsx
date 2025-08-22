import React, { useEffect } from 'react';
import Button from '../Button';
import { useLanguage } from '../../../hooks/useLanguage';
import './Modal.module.css';

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText,
  cancelText
}) => {
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
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {title && <div className="modal-header">{title}</div>}
        <div className="modal-body">
          {message}
        </div>
        <div className="modal-footer">
          {type === 'confirm' && (
            <>
              <Button
                variant="secondary"
                onClick={onClose}
              >
                {cancelText || t('cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
              >
                {confirmText || t('confirm')}
              </Button>
            </>
          )}
          {type === 'alert' && (
            <Button
              variant="primary"
              onClick={onClose}
            >
              {confirmText || t('ok')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
