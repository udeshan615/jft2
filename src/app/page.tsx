import Link from 'next/link';
import Image from 'next/image';
import { Shippori_Mincho } from 'next/font/google';
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
  Menu,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const shippori = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

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
  let categories = DEFAULT_CATEGORIES;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

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
    <div className="min-h-screen bg-white">
      {/* Header — logo + HelaJFT (blue/gold) + actions */}
      <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="HelaJFT"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
              priority
            />
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              <span className="text-[#123f6b]">Hela</span>
              <span className="text-[#c99a2e]">JFT</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="min-h-[40px] rounded-full bg-[#123f6b] hover:bg-[#0e3256]">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="min-h-[40px] text-[#123f6b]">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button size="sm" className="min-h-[40px] rounded-full bg-[#123f6b] hover:bg-[#0e3256]">
                    Sign up
                  </Button>
                </Link>
                <Link
                  href={user ? '/dashboard' : '/register'}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#123f6b] sm:hidden"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero — matches mockup: soft pastels, logo, HelaJFT, tagline, Explore + Sign in/up */}
        <section className="relative overflow-hidden">
          {/* Soft pastel circles background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fbff] to-[#eef5fb]" />
            <div className="absolute -right-16 top-8 h-64 w-64 rounded-full bg-sky-100/70 blur-sm" />
            <div className="absolute -left-20 top-32 h-56 w-56 rounded-full bg-amber-50/80 blur-sm" />
            <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-blue-50/60" />
            <div className="absolute bottom-40 left-1/3 h-32 w-32 rounded-full bg-rose-50/50" />
          </div>

          <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16">
            {/* Large logo */}
            <Image
              src="/logo.png"
              alt="HelaJFT logo"
              width={160}
              height={160}
              priority
              className="animate-scale-in mx-auto h-28 w-28 object-contain drop-shadow-lg sm:h-36 sm:w-36"
            />

            {/* Brand name — Hela blue, JFT gold */}
            <h1 className="mt-6 animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-[#123f6b]">Hela</span>
              <span className="text-[#c99a2e]">JFT</span>
            </h1>

            {/* Tagline from mockup */}
            <p className="mx-auto mt-4 max-w-md animate-fade-in text-base text-slate-500 sm:text-lg">
              Your Gateway to Japanese Opportunities
            </p>

            {/* Explore Now */}
            <div className="mt-8 animate-fade-in">
              <Link href={user ? '/dashboard' : '/register'}>
                <Button
                  size="lg"
                  className="min-h-[48px] rounded-full bg-[#123f6b] px-8 text-base font-semibold shadow-lg shadow-[#123f6b]/25 hover:bg-[#0e3256]"
                >
                  {user ? 'Continue Learning' : 'Explore Now'}
                  <span className="ml-1" aria-hidden>
                    →
                  </span>
                </Button>
              </Link>
            </div>

            {/* Sign up + Sign in under Explore Now */}
            {!user && (
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
            )}
          </div>

          {/* Bottom landscape strip — Fuji + temple + sakura vibe */}
          <div className="relative h-44 w-full overflow-hidden sm:h-56">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(186,220,245,0.45) 35%, rgba(135,180,220,0.7) 100%)',
              }}
            />
            {/* Soft mountain (Fuji-like) */}
            <svg
              className="absolute bottom-0 left-0 h-full w-full"
              viewBox="0 0 1200 280"
              preserveAspectRatio="xMidYMax slice"
              aria-hidden
            >
              <defs>
                <linearGradient id="fuji" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8f0f8" />
                  <stop offset="40%" stopColor="#a8c4dc" />
                  <stop offset="100%" stopColor="#6b9ab8" />
                </linearGradient>
                <linearGradient id="skyline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8fb4d0" />
                  <stop offset="100%" stopColor="#5a8aaa" />
                </linearGradient>
              </defs>
              {/* Distant hills */}
              <path
                d="M0 200 Q150 140 300 180 T600 160 T900 190 T1200 150 L1200 280 L0 280 Z"
                fill="url(#skyline)"
                opacity="0.5"
              />
              {/* Fuji silhouette */}
              <path
                d="M200 280 L480 70 L520 70 L800 280 Z"
                fill="url(#fuji)"
              />
              <path
                d="M430 110 L480 70 L520 70 L570 110 Q500 100 430 110 Z"
                fill="#f5f8fc"
                opacity="0.95"
              />
              {/* Simple pagoda shapes (right) */}
              <g transform="translate(920, 120)">
                <rect x="28" y="80" width="24" height="80" fill="#c43c32" />
                <rect x="8" y="70" width="64" height="12" rx="2" fill="#a83228" />
                <rect x="14" y="50" width="52" height="12" rx="2" fill="#c43c32" />
                <rect x="20" y="30" width="40" height="12" rx="2" fill="#a83228" />
                <rect x="26" y="12" width="28" height="12" rx="2" fill="#c43c32" />
                <polygon points="40,0 52,12 28,12" fill="#8b281f" />
              </g>
              {/* Sakura dots */}
              <circle cx="100" cy="200" r="8" fill="#f9c4d4" opacity="0.85" />
              <circle cx="130" cy="220" r="6" fill="#f5a8bc" opacity="0.8" />
              <circle cx="160" cy="195" r="7" fill="#f9c4d4" opacity="0.75" />
              <circle cx="1050" cy="210" r="9" fill="#f9c4d4" opacity="0.8" />
              <circle cx="1080" cy="230" r="6" fill="#f5a8bc" opacity="0.75" />
              <circle cx="1120" cy="200" r="7" fill="#f9c4d4" opacity="0.7" />
            </svg>
          </div>
        </section>

        {/* Which language */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-center text-xl font-bold tracking-tight text-[#123f6b] sm:text-2xl">
            WHICH LANGUAGE DO YOU WANT TO LEARN?
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              href={user ? '/learning' : '/register'}
              className="group w-full max-w-xs"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <span className="text-5xl">🇯🇵</span>
                <h3 className="mt-3 text-lg font-semibold text-[#123f6b]">Japanese</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full curriculum · Practice · Earn
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* What can you learn */}
        <section className="border-t border-slate-100 bg-slate-50/60 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-xl font-bold tracking-tight text-[#123f6b] sm:text-2xl">
              WHAT CAN YOU LEARN?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
              Learn Japanese your way — structured modules for every skill.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.title + c.href} href={user ? c.href : '/register'}>
                    <div className="flex h-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123f6b]/10 text-[#123f6b]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold leading-tight text-foreground">
                        {c.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
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
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#123f6b]/10 text-[#123f6b]">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-medium text-[#123f6b]">Hela</span>
          <span className="font-medium text-[#c99a2e]">JFT</span>
        </p>
      </footer>
    </div>
  );
}
