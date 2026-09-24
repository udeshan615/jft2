'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

/**
 * Non-blocking auth CTAs. Page HTML streams instantly;
 * session is checked client-side so homepage TTFB is not waiting on Supabase.
 */
export function HeroAuthActions() {
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUser(!!data.session?.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(!!session?.user);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // While unknown, show guest CTAs (no flash of wrong state for logged-out majority)
  if (user) {
    return (
      <div className="mt-8 flex justify-center">
        <Link href="/dashboard">
          <Button
            size="lg"
            className="min-h-[48px] rounded-full bg-[#123f6b] px-8 text-base font-semibold shadow-lg shadow-[#123f6b]/25 hover:bg-[#0e3256]"
          >
            Continue Learning →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex justify-center">
        <Link href="/register">
          <Button
            size="lg"
            className="min-h-[48px] rounded-full bg-[#123f6b] px-8 text-base font-semibold shadow-lg shadow-[#123f6b]/25 hover:bg-[#0e3256]"
          >
            Explore Now →
          </Button>
        </Link>
      </div>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/register" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] w-full min-w-[140px] rounded-full border-[#123f6b]/30 text-[#123f6b] hover:bg-[#123f6b]/5"
          >
            Sign up
          </Button>
        </Link>
        <Link href="/login" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] w-full min-w-[140px] rounded-full border-[#123f6b]/30 text-[#123f6b] hover:bg-[#123f6b]/5"
          >
            Sign in
          </Button>
        </Link>
      </div>
    </>
  );
}

export function HeaderAuthActions() {
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUser(!!data.session?.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user) {
    return (
      <Link href="/dashboard">
        <Button size="sm" className="min-h-[40px] rounded-full bg-[#123f6b] hover:bg-[#0e3256]">
          Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="hidden sm:block">
        <Button variant="ghost" size="sm" className="min-h-[40px] text-[#123f6b]">
          Sign in
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm" className="min-h-[40px] rounded-full bg-[#123f6b] hover:bg-[#0e3256]">
          Sign up
        </Button>
      </Link>
    </>
  );
}
