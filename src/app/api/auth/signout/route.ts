import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'workos_session';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
