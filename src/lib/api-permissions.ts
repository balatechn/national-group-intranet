import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/workos-auth';
import { canViewModule, canEditModule, type AppModule, type UserRole } from '@/lib/permissions';

/**
 * Checks if the current user can VIEW a module.
 * Returns { user, response } — if response is set, return it immediately (unauthorized).
 */
export async function requireView(module: AppModule) {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const allowed = await canViewModule(user.role as UserRole, module);
  if (!allowed) {
    return {
      user,
      response: NextResponse.json(
        { message: `You do not have permission to view ${module}` },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * Checks if the current user can EDIT in a module.
 * Returns { user, response } — if response is set, return it immediately (unauthorized).
 */
export async function requireEdit(module: AppModule) {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const allowed = await canEditModule(user.role as UserRole, module);
  if (!allowed) {
    return {
      user,
      response: NextResponse.json(
        { message: `You do not have permission to edit ${module}` },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
