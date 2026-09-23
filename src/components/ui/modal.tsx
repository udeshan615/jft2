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
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
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
          'relative z-10 w-full rounded-t-2xl border border-border bg-card p-5 shadow-xl animate-slide-up sm:rounded-2xl sm:p-6',
          sizeMap[size],
          className
        )}
      >
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {showClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
