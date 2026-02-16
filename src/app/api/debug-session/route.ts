import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/workos-auth';

// Debug endpoint - DELETE after troubleshooting
// Access: /api/debug-session?key=national2026setup
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (key !== 'national2026setup') {
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    // 1. Check current session from cookie
    let sessionData = null;
    try {
      const session = await getSession();
      sessionData = session;
    } catch (e: any) {
      sessionData = { error: e.message };
    }

    // 2. Check user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: 'bala@nationalgroupindia.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        role: true,
        status: true,
        employeeId: true,
        jobTitle: true,
        companyId: true,
        departmentId: true,
        lastLoginAt: true,
      },
    });

    // 3. Count total users
    const totalUsers = await prisma.user.count();

    // 4. List all users with roles
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        displayName: true,
        status: true,
      },
      orderBy: { email: 'asc' },
    });

    return NextResponse.json({
      currentSession: sessionData,
      targetUser: dbUser,
      totalUsers,
      allUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
