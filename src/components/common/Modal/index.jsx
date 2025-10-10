import React, { useEffect } from 'react';
import Card from '../Card';
import IconButton from '../IconButton';
import Button from '../Button';
import { useLanguage } from '../../../hooks/useLanguage';

const Modal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title,
  message,
  children,
  type = 'custom',
  confirmText,
  cancelText,
  maxWidth = 'max-w-2xl',
  padding = 'none',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  zIndex = 10000,
  ...props
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
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const isConfirmModal = type === 'confirm' || type === 'alert';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <Card 
        variant="base" 
        padding={padding}
        className={`log-modal-content ${maxWidth} m-md ${className}`} 
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-lg border-b">
            {title && (
              <div className="flex-1">
                {typeof title === 'string' ? (
                  <h3 className="text-lg font-semibold text-primary">{title}</h3>
                ) : (
                  title
                )}
              </div>
            )}
            {showCloseButton && (
              <IconButton
                icon="×"
                onClick={onClose}
                variant="ghost"
                size="small"
                className="w-8 h-8 flex items-center justify-center"
                aria-label={t('close') || '关闭'}
              />
            )}
          </div>
        )}
        
        {isConfirmModal ? (
          <>
            <div className="p-lg">
              {message}
            </div>
            <div className="flex justify-end gap-sm p-lg border-t">
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
          </>
        ) : (
          children
        )}
      </Card>
    </div>
  );
};

export default Modal;
