import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Gift, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight text-primary">
              日本語
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Rewards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/80">
              Japanese Learning Platform
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Learn Japanese.
              <br />
              <span className="text-primary">Earn rewards.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Practice kanji, grammar, listening and reading. Complete daily
              challenges and referral goals. Withdraw your earnings easily.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="min-w-[160px]">
                  Create free account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="min-w-[160px]">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            {[
              {
                icon: BookOpen,
                title: 'Structured practice',
                desc: 'Kanji, grammar, listening & reading modules designed for real progress.',
              },
              {
                icon: Gift,
                title: 'Earn while learning',
                desc: 'Daily games, challenges and rewards paid in LKR.',
              },
              {
                icon: Users,
                title: 'Referral bonuses',
                desc: 'Invite friends and earn a share of their progress rewards.',
              },
              {
                icon: Sparkles,
                title: 'Verified community',
                desc: 'Simple verification keeps the platform fair for everyone.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nihongo Rewards · Phase 1 foundation</p>
      </footer>
    </div>
  );
}
