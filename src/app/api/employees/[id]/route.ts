import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';
import { updateUserSchema } from '@/validations';
import { hash } from 'bcryptjs';
import { sendEmail, getPasswordResetByAdminEmail, getEmployeeUpdatedEmail } from '@/lib/email';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        phone: true,
        avatar: true,
        jobTitle: true,
        role: true,
        status: true,
        companyId: true,
        departmentId: true,
        managerId: true,
        company: { select: { id: true, name: true, shortName: true } },
        department: { select: { id: true, name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'];
    if (!adminRoles.includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check employee exists
    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await request.json();

    // Handle password reset separately
    if (body.newPassword) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      const hashedPassword = await hash(body.newPassword, 12);
      await prisma.user.update({
        where: { id: params.id },
        data: { password: hashedPassword },
      });

      // Send password reset notification email
      try {
        const empName = `${existing.firstName} ${existing.lastName}`;
        const emailContent = getPasswordResetByAdminEmail(empName);
        await sendEmail({
          to: existing.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      return NextResponse.json({ success: true, message: 'Password reset successfully' });
    }

    const validated = updateUserSchema.parse(body);

    // Check for duplicate email if changing
    if (validated.email && validated.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validated.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'An employee with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Check for duplicate employee ID if changing
    if (validated.employeeId && validated.employeeId !== existing.employeeId) {
      const empIdExists = await prisma.user.findUnique({
        where: { employeeId: validated.employeeId },
      });
      if (empIdExists) {
        return NextResponse.json(
          { error: 'An employee with this Employee ID already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data, handling nullable fields
    const updateData: Record<string, any> = { ...validated };

    // Update displayName if first or last name changed
    if (validated.firstName || validated.lastName) {
      updateData.displayName = `${validated.firstName || existing.firstName} ${validated.lastName || existing.lastName}`;
    }

    // Handle clearing optional relations
    if (body.companyId === null || body.companyId === '') {
      updateData.companyId = null;
    }
    if (body.departmentId === null || body.departmentId === '') {
      updateData.departmentId = null;
    }
    if (body.managerId === null || body.managerId === '') {
      updateData.managerId = null;
    }

    const updatedEmployee = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        phone: true,
        jobTitle: true,
        role: true,
        status: true,
        company: { select: { id: true, name: true, shortName: true } },
        department: { select: { id: true, name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
      },
    });

    // Send profile updated notification email
    try {
      const fieldLabels: Record<string, string> = {
        firstName: 'First Name', lastName: 'Last Name', email: 'Email',
        phone: 'Phone', jobTitle: 'Job Title', role: 'Role', status: 'Status',
        companyId: 'Company', departmentId: 'Department', managerId: 'Manager',
        employeeId: 'Employee ID',
      };
      const changes = Object.keys(validated)
        .filter((key) => key in fieldLabels && (validated as any)[key] !== (existing as any)[key])
        .map((key) => fieldLabels[key]);

      if (changes.length > 0) {
        const empName = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`;
        const emailContent = getEmployeeUpdatedEmail(empName, changes);
        await sendEmail({
          to: updatedEmployee.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.error('Failed to send profile update email:', emailError);
    }

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}
