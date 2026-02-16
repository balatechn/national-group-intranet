import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getRolePermissions, type UserRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);
const COOKIE_NAME = 'workos_session';

// GET - Fetch the current user's permissions
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getRolePermissions(session.user.role as UserRole);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
