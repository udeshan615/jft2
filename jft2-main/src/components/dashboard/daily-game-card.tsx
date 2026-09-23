'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface DailyGameCardProps {
  enabled: boolean;
  startTime: string; // "HH:MM"
  endTime: string;
}

type GameState = 'upcoming' | 'live' | 'ended' | 'disabled';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.replace(/"/g, '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function getState(enabled: boolean, start: string, end: string): GameState {
  if (!enabled) return 'disabled';
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);
  if (mins < s) return 'upcoming';
  if (mins > e) return 'ended';
  return 'live';
}

function formatCountdown(start: string): string {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const s = parseTimeToMinutes(start);
  let diff = s - mins;
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function DailyGameCard({
  enabled,
  startTime,
  endTime,
}: DailyGameCardProps) {
  const [state, setState] = useState<GameState>(() =>
    getState(enabled, startTime, endTime)
  );
  const [countdown, setCountdown] = useState(() => formatCountdown(startTime));

  useEffect(() => {
    const tick = () => {
      setState(getState(enabled, startTime, endTime));
      setCountdown(formatCountdown(startTime));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [enabled, startTime, endTime]);

  const label =
    state === 'live'
      ? 'LIVE'
      : state === 'upcoming'
        ? 'UPCOMING'
        : state === 'ended'
          ? 'ENDED'
          : 'OFF';

  const badgeVariant =
    state === 'live'
      ? 'success'
      : state === 'upcoming'
        ? 'warning'
        : 'muted';

  return (
    <Card
      className={cn(
        'overflow-hidden border-primary/20 transition-shadow hover:shadow-md',
        state === 'live' && 'shadow-[0_0_24px_-10px_rgba(45,74,111,0.4)]'
      )}
    >
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Daily Game</h3>
              <Badge variant={badgeVariant as 'success' | 'warning' | 'muted'}>
                {label}
              </Badge>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {state === 'upcoming' && `Starts in ${countdown}`}
              {state === 'live' && `Open until ${endTime}`}
              {state === 'ended' && 'Come back tomorrow'}
              {state === 'disabled' && 'Not available'}
            </p>
          </div>
        </div>
        <Link href="/daily-game">
          <Button
            size="sm"
            variant={state === 'live' ? 'default' : 'outline'}
            disabled={state === 'disabled'}
          >
            {state === 'live' ? 'Start' : 'View'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
