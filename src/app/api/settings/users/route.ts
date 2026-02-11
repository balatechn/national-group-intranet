import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/workos-auth';
import { prisma } from '@/lib/db';

// PATCH - Update user role, company, or status
export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can manage users
    const userRole = sessionUser.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, companyId, status } = body;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent non-SUPER_ADMIN from modifying SUPER_ADMIN users
    if (targetUser.role === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only Super Admins can modify other Super Admin accounts' },
        { status: 403 }
      );
    }

    // Prevent setting someone to SUPER_ADMIN unless you are SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only Super Admins can assign the Super Admin role' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (role !== undefined) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (companyId !== undefined) {
      if (companyId === null) {
        updateData.companyId = null;
      } else {
        // Verify company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
          return NextResponse.json({ message: 'Company not found' }, { status: 404 });
        }
        updateData.companyId = companyId;
      }
    }

    if (status !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
      }
      // Prevent self-deactivation
      if (userId === sessionUser.id && status !== 'ACTIVE') {
        return NextResponse.json({ message: 'You cannot deactivate your own account' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}
