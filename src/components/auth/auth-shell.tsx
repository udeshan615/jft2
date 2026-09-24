import Image from 'next/image';
import Link from 'next/link';
import { Shippori_Mincho } from 'next/font/google';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const shippori = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export function AuthShell({
  title,
  subtitle,
  tagline,
  children,
}: {
  title: string;
  subtitle: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Brand panel — Japan x Sri Lanka quadrant palette from the HelaJFT mark */}
      <div className="relative flex min-h-[40vh] w-full flex-col items-center justify-center overflow-hidden px-8 py-12 lg:min-h-screen lg:w-[46%] lg:py-16">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 22% 24%, #123f6b 0 34%, transparent 35%),' +
              'radial-gradient(circle at 78% 24%, #b8262c 0 34%, transparent 35%),' +
              'radial-gradient(circle at 22% 76%, #106057 0 34%, transparent 35%),' +
              'radial-gradient(circle at 78% 76%, #c99a2e 0 34%, transparent 35%),' +
              'linear-gradient(160deg,#0a2f52,#124842 55%,#7c4a14 100%)',
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_45%,rgba(250,246,238,0.10),transparent_60%)]" />

        <Link
          href="/"
          className="group relative z-10 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#faf6ee] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] ring-4 ring-white/10 transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32">
            <Image
              src="/logo.png"
              alt="HelaJFT logo"
              width={112}
              height={112}
              priority
              className="h-full w-full rounded-full object-contain"
            />
          </div>
          <h1
            className={`${shippori.className} text-4xl font-extrabold tracking-tight text-[#faf6ee] drop-shadow-[0_3px_18px_rgba(0,0,0,0.35)] sm:text-5xl`}
          >
            HelaJFT
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-[#faf6ee]/85 sm:text-base">
            {tagline}
          </p>
        </Link>

        <div className="relative z-10 mt-7 hidden gap-5 text-xs tracking-wide text-[#faf6ee]/70 sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            සිංහල
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            日本語
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            JFT-Basic
          </span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-[var(--background)] px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Card className="animate-scale-in border-border/60 bg-card/95 shadow-xl backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2 text-center">
              <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </CardTitle>
              <CardDescription className="text-sm">{subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">{children}</CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} HelaJFT · Learn Japanese · Earn rewards
          </p>
        </div>
      </div>
    </div>
  );
}
