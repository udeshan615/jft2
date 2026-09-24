import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export const metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Japanese-inspired soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#fff5f7_0%,#f0f4ff_35%,#faf6f0_70%,#ffeef2_100%)]" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-pink-300/50" />
        <div className="absolute right-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-pink-400/40" />
        <div className="absolute left-[22%] bottom-[22%] h-2 w-2 rounded-full bg-rose-300/45" />
        <div className="absolute right-[28%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-sky-300/40" />
      </div>

      {/* Brand header with real logo */}
      <div className="mb-8 animate-fade-in text-center">
        <Link href="/" className="group inline-flex flex-col items-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl shadow-xl shadow-black/20 transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
            <Image
              src="/logo.png"
              alt="HelaJFT Logo"
              width={112}
              height={112}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            HelaJFT
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your way to learn Japanese with AI
          </p>
        </Link>
      </div>

      <Card className="w-full max-w-md animate-scale-in border-white/60 bg-white/80 shadow-xl shadow-pink-100/40 backdrop-blur-md">
        <CardHeader className="space-y-1 pb-2 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in to continue learning and earning rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="mt-8 animate-fade-in text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HelaJFT · Learn Japanese · Earn rewards
      </p>
    </div>
  );
}
