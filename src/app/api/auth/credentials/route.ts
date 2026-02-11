import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithPassword } from '@/lib/workos-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateWithPassword(email, password);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Credentials login error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
