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
  let heroTitle = 'ආසාවෙන් ජපන් ඉගෙන ගමු!';
  let heroSubtitle =
    'Rōmaji, Hiragana, Katakana, Kanji, Grammar, Listening, Reading, Kaiwa, Past Papers සහ තව බොහෝ දේ — ඉගෙන ගනිද්දීම rewards earn කරන්න.';
  let heroImage = '';
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
        if (row.key === 'homepage_hero_image' && v) heroImage = v;
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
            <Image
              src="/logo.png"
              alt="HelaJFT"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
              priority
            />
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
        {/* Hero — Japan-style gradient, HelaJFT name → logo → headline */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(circle at 12% 18%, rgba(18,63,107,0.16), transparent 42%),' +
                'radial-gradient(circle at 88% 12%, rgba(184,38,44,0.14), transparent 40%),' +
                'radial-gradient(circle at 15% 88%, rgba(16,96,87,0.15), transparent 42%),' +
                'radial-gradient(circle at 88% 85%, rgba(201,154,46,0.18), transparent 42%),' +
                'linear-gradient(160deg,#fdf8ef 0%,#f6efe1 45%,#fdf3ec 100%)',
            }}
          />
          {/* soft rising-sun ring, a quiet nod to the Japan theme */}
          <div className="pointer-events-none absolute left-1/2 top-6 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-[#b8262c]/10 sm:h-[560px] sm:w-[560px]" />

          <div className="relative mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <p
              className={`${shippori.className} animate-fade-in text-2xl font-extrabold tracking-tight text-[#123f6b] sm:text-3xl`}
            >
              HelaJFT
            </p>

            <Image
              src="/logo.png"
              alt="HelaJFT logo"
              width={128}
              height={128}
              priority
              className="animate-scale-in mx-auto my-6 h-24 w-24 object-contain drop-shadow-[0_16px_30px_rgba(18,63,107,0.25)] sm:h-32 sm:w-32"
            />

            <h1
              className={`${shippori.className} animate-slide-up text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl`}
            >
              {heroTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
        </section>

        {/* App showcase — image is set from Admin → System Settings → Homepage content */}
        <section className="border-b border-border bg-muted/30 py-14 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <div className="relative mx-auto flex max-w-xs justify-center sm:max-w-sm">
              {/* phone frame */}
              <div className="relative aspect-[9/18.5] w-full overflow-hidden rounded-[2.5rem] border-[10px] border-[#123f6b] bg-[#123f6b] shadow-[0_24px_50px_rgba(18,63,107,0.25)]">
                <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#123f6b]" />
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt="HelaJFT app preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#fdf8ef] p-6 text-center">
                    <Image
                      src="/logo.png"
                      alt="HelaJFT"
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                    <p className={`${shippori.className} text-base font-bold text-[#123f6b]`}>
                      HelaJFT
                    </p>
                    <div className="mt-2 w-full space-y-2">
                      {[100, 85, 92, 70].map((w, i) => (
                        <div
                          key={i}
                          className="mx-auto h-2.5 rounded-full bg-[#123f6b]/10"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10">
              <Link href={user ? '/dashboard' : '/register'}>
                <Button size="lg" className="min-h-[52px] w-full max-w-xs text-base">
                  {user ? 'Continue Learning' : 'Get Started'}
                </Button>
              </Link>
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
