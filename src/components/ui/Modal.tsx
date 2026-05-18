import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          'relative z-10 w-full max-w-[480px] rounded-card border border-border bg-surface shadow-modal',
          'flex flex-col max-h-[90vh] overflow-hidden',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-h2 font-bold text-fg">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="text-fg hover:opacity-70 cursor-pointer"
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
