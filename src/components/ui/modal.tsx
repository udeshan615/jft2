'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Sticky action bar pinned below scrollable body (e.g. Confirm button) */
  footer?: React.ReactNode;
  className?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  showClose = true,
  size = 'md',
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          // Use dvh so mobile browser chrome / keyboard does not clip the sheet
          'relative z-10 flex w-full max-h-[min(92dvh,900px)] flex-col rounded-t-2xl border border-border bg-card shadow-xl animate-slide-up sm:rounded-2xl',
          sizeMap[size],
          className
        )}
      >
        {(title || showClose) && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-base font-semibold tracking-tight sm:text-lg"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Scrollable form body — never clips the footer */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>

        {/* Sticky footer: always visible above bottom edge / keyboard */}
        {footer && (
          <div className="shrink-0 border-t border-border/60 bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
