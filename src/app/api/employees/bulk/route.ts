import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No data provided' },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const defaultPassword = await hash('Welcome@123', 12);

    for (const row of data) {
      try {
        // Find company by code
        const company = await prisma.company.findUnique({
          where: { code: row.companyCode },
        });

        if (!company) {
          errors.push(`Employee "${row.employeeId}": Company code "${row.companyCode}" not found`);
          continue;
        }

        // Find department if provided
        let departmentId: string | null = null;
        if (row.departmentCode) {
          const department = await prisma.department.findUnique({
            where: { companyId_code: { companyId: company.id, code: row.departmentCode } },
          });
          if (department) {
            departmentId = department.id;
          }
        }

        // Find manager if provided
        let managerId: string | null = null;
        if (row.managerEmail) {
          const manager = await prisma.user.findUnique({
            where: { email: row.managerEmail },
          });
          if (manager) {
            managerId = manager.id;
          }
        }

        // Map role string to enum
        const roleMap: Record<string, string> = {
          'SUPER_ADMIN': 'SUPER_ADMIN',
          'ADMIN': 'ADMIN',
          'IT_ADMIN': 'IT_ADMIN',
          'HR_ADMIN': 'HR_ADMIN',
          'MANAGER': 'MANAGER',
          'EMPLOYEE': 'EMPLOYEE',
        };
        const role = roleMap[row.role?.toUpperCase()] || 'EMPLOYEE';

        // Check if employee exists
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: row.employeeId },
              { email: row.email },
            ],
          },
        });

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              firstName: row.firstName,
              lastName: row.lastName,
              displayName: row.displayName || null,
              phone: row.phone || null,
              jobTitle: row.jobTitle || null,
              companyId: company.id,
              departmentId,
              managerId,
              role: role as any,
            },
          });
          updated++;
        } else {
          await prisma.user.create({
            data: {
              employeeId: row.employeeId,
              email: row.email,
              password: defaultPassword,
              firstName: row.firstName,
              lastName: row.lastName,
              displayName: row.displayName || null,
              phone: row.phone || null,
              jobTitle: row.jobTitle || null,
              companyId: company.id,
              departmentId,
              managerId,
              role: role as any,
              status: 'ACTIVE',
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row "${row.employeeId}": ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${created + updated} employees (${created} created, ${updated} updated). New employees have password: Welcome@123`,
      count: created + updated,
      created,
      updated,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process upload: ' + error.message },
      { status: 500 }
    );
  }
}
