// Next.js Edge middleware enforcing route protection and authentication redirects.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/projects',
  '/institutions',
  '/library',
  '/blueprint-templates',
  '/kits',
  '/templates',
  '/users',
  '/versions',
];

const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/** Middleware function validating authentication cookies and redirecting unauthorized visitors. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    request.cookies.get('slotly_session')?.value ||
    request.cookies.get('slotly_rt')?.value ||
    request.cookies.get('refreshToken')?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const isAuthPage = AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // If requesting a protected route without an auth cookie, redirect immediately to login
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname && pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and navigating to login or register, redirect to dashboard
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

/** Configuration matcher defining route paths subject to edge middleware interception. */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/institutions/:path*',
    '/library/:path*',
    '/blueprint-templates/:path*',
    '/kits/:path*',
    '/templates/:path*',
    '/users/:path*',
    '/versions/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
