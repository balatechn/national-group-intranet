import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/workos-auth';
import { getRolePermissions, type UserRole } from '@/lib/permissions';

// GET - Fetch the current user's permissions
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getRolePermissions(sessionUser.role as UserRole);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
