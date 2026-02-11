import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);

const COOKIE_NAME = 'workos_session';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth'];

// Routes that are always accessible
const alwaysAccessible = ['/_next', '/favicon.ico', '/images', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and always accessible routes
  if (alwaysAccessible.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Get session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

  // Verify session
  let isAuthenticated = false;
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
      const session = payload.session as any;
      
      // Check if session is not expired
      if (session && session.expiresAt > Date.now()) {
        isAuthenticated = true;
      }
    } catch (error) {
      // Invalid or expired token
      isAuthenticated = false;
    }
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
