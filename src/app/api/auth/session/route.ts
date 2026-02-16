import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);

const COOKIE_NAME = 'workos_session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;

    if (!session || !session.user) {
      return NextResponse.json({ user: null });
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ user: null });
  }
}
