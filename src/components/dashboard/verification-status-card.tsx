'use client';

import Link from 'next/link';
import { BadgeCheck, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { VerificationStatus } from '@/lib/types/database';

interface VerificationStatusCardProps {
  status: VerificationStatus;
  completedTasks: number;
  requiredTasks: number;
}

export function VerificationStatusCard({
  status,
  completedTasks,
  requiredTasks,
}: VerificationStatusCardProps) {
  const isVerified = status === 'verified';
  const isPending = status === 'pending';

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow',
        isVerified && 'border-success/30 shadow-[0_0_20px_-8px_rgba(74,124,89,0.35)]',
        !isVerified && !isPending && 'border-warning/25'
      )}
    >
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              isVerified
                ? 'bg-success/15 text-success'
                : isPending
                  ? 'bg-warning/15 text-warning'
                  : 'bg-warning/15 text-warning'
            )}
          >
            {isVerified ? (
              <BadgeCheck className="h-5 w-5" />
            ) : isPending ? (
              <Clock className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                {isVerified
                  ? 'Account verified'
                  : isPending
                    ? 'Verification in progress'
                    : 'Account not verified'}
              </h3>
              <Badge
                variant={
                  isVerified ? 'success' : isPending ? 'warning' : 'muted'
                }
              >
                {status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isVerified
                ? 'You have full access to rewards and features.'
                : requiredTasks > 0
                  ? `${completedTasks} of ${requiredTasks} required tasks completed`
                  : 'Complete verification tasks to unlock full features.'}
            </p>
            {!isVerified && requiredTasks > 0 && (
              <div className="mt-2 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (completedTasks / requiredTasks) * 100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {!isVerified && (
          <Link href="/verification" className="shrink-0">
            <Button variant={isPending ? 'outline' : 'default'} size="sm">
              {isPending ? 'View status' : 'Verify now'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
