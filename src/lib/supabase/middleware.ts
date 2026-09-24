import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_EXACT = new Set(['/', '/login', '/register']);
const PUBLIC_PREFIX = ['/auth/'];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIX.some((p) => pathname.startsWith(p));
}

function hasAuthCookie(request: NextRequest) {
  // Supabase SSR cookies typically start with sb-
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.value);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Fast path: public page + no auth cookie → skip Supabase network entirely
  if (isPublicPath(pathname) && !hasAuthCookie(request)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session only when needed (cookie present or protected route)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/earnings') ||
    pathname.startsWith('/referral') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/verification') ||
    pathname.startsWith('/daily-game') ||
    pathname.startsWith('/learning') ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/purchases') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings');

  const isAdminRoute = pathname.startsWith('/admin');

  if (!user && (isAppRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    // Role check deferred to admin layout; presence is enough here
  }

  // Logged-in users visiting login/register → dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
