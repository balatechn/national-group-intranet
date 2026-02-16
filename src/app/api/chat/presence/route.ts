import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);
const COOKIE_NAME = 'workos_session';

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;
    return session?.user || null;
  } catch {
    return null;
  }
}

// POST - Heartbeat (mark user as online)
// GET - Get online users
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update own presence
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Users active in last 2 minutes = online
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const onlineUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        lastActiveAt: { gte: twoMinutesAgo },
        id: { not: user.id },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        jobTitle: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    // Also get all active users for "all users" list
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: user.id },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        jobTitle: true,
        lastActiveAt: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({
      onlineUsers,
      allUsers,
      currentUserId: user.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
