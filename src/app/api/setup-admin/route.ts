import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

// ONE-TIME setup route - creates the super admin user
// Access: /api/setup-admin?key=national2026setup
// DELETE THIS FILE after first use for security
export async function GET(request: NextRequest) {
  try {
    // Simple security key to prevent random access
    const key = request.nextUrl.searchParams.get('key');
    if (key !== 'national2026setup') {
      return NextResponse.json(
        { error: 'Invalid setup key. Use ?key=national2026setup' },
        { status: 403 }
      );
    }

    const passwordHash = await hash('Password@123', 12);

    // Get the first company for assignment
    const company = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get a department
    const department = company
      ? await prisma.department.findFirst({
          where: { companyId: company.id, isActive: true },
        })
      : null;

    const user = await prisma.user.upsert({
      where: { email: 'bala@nationalgroupindia.com' },
      update: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        password: passwordHash,
      },
      create: {
        employeeId: 'NGI-OWN-001',
        email: 'bala@nationalgroupindia.com',
        password: passwordHash,
        firstName: 'Bala',
        lastName: 'Tech',
        displayName: 'Bala',
        role: 'SUPER_ADMIN',
        phone: '+91 98450 00000',
        companyId: company?.id || null,
        departmentId: department?.id || null,
        jobTitle: 'Owner / Super Admin',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super admin user created/updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      },
      loginCredentials: {
        email: 'bala@nationalgroupindia.com',
        password: 'Password@123',
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed', details: String(error) },
      { status: 500 }
    );
  }
}
