'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface SectionIntroModalProps {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  nextLabel?: string;
}

/**
 * Reusable first-time section introduction modal.
 * Used for Verification, Dashboard, Earnings, Referral, learning modules, etc.
 */
export function SectionIntroModal({
  open,
  onClose,
  onNext,
  title,
  description,
  icon,
  nextLabel = 'Next',
}: SectionIntroModalProps) {
  return (
    <Modal open={open} onClose={onClose} showClose size="md">
      <div className="flex flex-col items-center text-center">
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Button className="mt-6 w-full" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </Modal>
  );
}
