import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/workos-auth';
import { prisma } from '@/lib/db';
import {
  getAllRolePermissions,
  APP_MODULES,
  ALL_ROLES,
  type AppModule,
  type UserRole,
} from '@/lib/permissions';

// GET - Fetch all role permissions
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can see permissions
    if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const permissions = await getAllRolePermissions();

    // Also fetch companies and departments for scope dropdowns
    const [companies, departments] = await Promise.all([
      prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.department.findMany({
        select: { id: true, name: true, companyId: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ permissions, companies, departments });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST - Save role permissions
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Non-SUPER_ADMIN cannot edit SUPER_ADMIN permissions
    const body = await request.json();
    const { permissions } = body as {
      permissions: Array<{
        role: UserRole;
        module: AppModule;
        canView: boolean;
        canEdit: boolean;
        companyIds?: string[];
        departmentIds?: string[];
      }>;
    };

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    // Validate and upsert permissions
    for (const perm of permissions) {
      // Validate role and module
      if (!ALL_ROLES.includes(perm.role) || !APP_MODULES.includes(perm.module)) {
        continue;
      }

      // ADMIN cannot change SUPER_ADMIN permissions
      if (sessionUser.role === 'ADMIN' && perm.role === 'SUPER_ADMIN') {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role: perm.role,
            module: perm.module,
          },
        },
        update: {
          canView: perm.canView,
          canEdit: perm.canEdit,
          companyIds: perm.companyIds || [],
          departmentIds: perm.departmentIds || [],
        },
        create: {
          role: perm.role,
          module: perm.module,
          canView: perm.canView,
          canEdit: perm.canEdit,
          companyIds: perm.companyIds || [],
          departmentIds: perm.departmentIds || [],
        },
      });
    }

    return NextResponse.json({ message: 'Permissions saved successfully' });
  } catch (error) {
    console.error('Error saving permissions:', error);
    return NextResponse.json({ message: 'Failed to save permissions' }, { status: 500 });
  }
}
