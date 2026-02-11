import { NextResponse } from 'next/server';
import { getSession } from '@/lib/workos-auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ user: null });
  }
}
