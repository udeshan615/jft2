import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Gift,
  Users,
  Sparkles,
  Languages,
  Headphones,
  BookMarked,
  MessageCircle,
  FileText,
  Gamepad2,
  Type,
  ScrollText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_CATEGORIES = [
  { title: 'Rōmaji', description: 'Learn Japanese pronunciation using Rōmaji', icon: Type, href: '/learning' },
  { title: 'Kanji', description: 'Learn and practice Japanese Kanji', icon: Languages, href: '/learning/kanji' },
  { title: 'Grammar', description: 'Practice Japanese grammar', icon: BookOpen, href: '/learning/grammar' },
  { title: 'Listening', description: 'Improve your Japanese listening skills', icon: Headphones, href: '/learning/listening' },
  { title: 'Reading', description: 'Practice Japanese reading', icon: BookMarked, href: '/learning/reading' },
  { title: 'Kaiwa', description: 'Practice Japanese conversations', icon: MessageCircle, href: '/learning/listening' },
  { title: 'Past Papers', description: 'Practice previous exam papers', icon: ScrollText, href: '/learning/past-papers' },
  { title: 'Model Papers', description: 'Practice model exam papers', icon: FileText, href: '/learning/model-papers' },
  { title: 'Games', description: 'Learn Japanese through practice games', icon: Gamepad2, href: '/daily-game' },
  { title: 'Practice', description: 'General practice questions', icon: Sparkles, href: '/learning/practice' },
];

export default async function HomePage() {
  let user = null;
  let heroTitle = 'YOUR WAY TO LEARN JAPANESE WITH AI!';
  let heroSubtitle =
    'Master Rōmaji, Hiragana, Katakana, Kanji, Grammar, Listening, Reading, Kaiwa, Past Papers and more — earn rewards as you learn.';
  let categories = DEFAULT_CATEGORIES;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['homepage_hero_title', 'homepage_hero_subtitle', 'homepage_hero_image']);

    if (settings) {
      for (const row of settings) {
        const v = typeof row.value === 'string'
          ? row.value.replace(/^"|"$/g, '')
          : String(row.value ?? '');
        if (row.key === 'homepage_hero_title' && v) heroTitle = v;
        if (row.key === 'homepage_hero_subtitle' && v) heroSubtitle = v;
      }
    }

    const { data: cats } = await supabase
      .from('homepage_categories')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    if (cats && cats.length > 0) {
      categories = cats.map((c) => {
        const match = DEFAULT_CATEGORIES.find(
          (d) => d.href === c.destination_route || d.title === c.title
        );
        return {
          title: c.title,
          description: c.description || match?.description || '',
          icon: match?.icon || BookOpen,
          href: c.destination_route || '/learning',
        };
      });
    }
  } catch {
    // Public page — tolerate missing DB
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xl font-semibold tracking-tight text-primary sm:text-2xl">
              Nihongo Rewards
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="min-h-[40px]">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="min-h-[40px]">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="min-h-[40px]">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-sky-500/5" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:py-20">
            <div className="animate-slide-up text-center lg:text-left">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
                Japanese Learning Platform
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link href={user ? '/dashboard' : '/register'} className="w-full sm:w-auto">
                  <Button size="lg" className="min-h-[48px] w-full min-w-[160px] text-base">
                    {user ? 'Continue Learning' : 'Get Started Free'}
                  </Button>
                </Link>
                {!user && (
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="min-h-[48px] w-full min-w-[160px] text-base">
                      Sign in
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative mx-auto flex max-w-md items-center justify-center lg:max-w-none">
              <div className="relative aspect-square w-full max-w-sm rounded-3xl bg-gradient-to-br from-primary/20 via-sky-400/15 to-violet-500/10 p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <span className="text-6xl sm:text-7xl">🇯🇵</span>
                  <p className="text-lg font-semibold text-foreground">Learn Japanese</p>
                  <p className="text-sm text-muted-foreground">
                    AI-assisted · Mobile-first · Earn rewards
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {['漢字', '文法', '会話', '聴解'].map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-card px-3 py-1 text-sm font-medium shadow-sm border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Which language */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
            WHICH LANGUAGE DO YOU WANT TO LEARN?
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              href={user ? '/learning' : '/register'}
              className="group w-full max-w-xs"
            >
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <span className="text-5xl">🇯🇵</span>
                <h3 className="mt-3 text-lg font-semibold">Japanese</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full curriculum · Practice · Earn
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* What can you learn */}
        <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
              WHAT CAN YOU LEARN?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
              Learn Japanese your way — structured modules for every skill.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.title}
                    href={user ? c.href : '/register'}
                    className="group min-h-[44px]"
                  >
                    <div className="flex h-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold leading-tight">{c.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <p>© {new Date().getFullYear()} Nihongo Rewards</p>
      </footer>
    </div>
  );
}
