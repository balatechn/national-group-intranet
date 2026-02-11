import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/workos-auth';
import { hash } from 'bcryptjs';
import { createUserSchema } from '@/validations';

export const revalidate = 60;

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
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
        company: {
          select: {
            id: true,
            name: true,
            shortName: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'];
    if (!adminRoles.includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Check for duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An employee with this email already exists' },
        { status: 409 }
      );
    }

    // Check for duplicate employee ID
    const existingEmpId = await prisma.user.findUnique({
      where: { employeeId: validated.employeeId },
    });
    if (existingEmpId) {
      return NextResponse.json(
        { error: 'An employee with this Employee ID already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 12);

    const newEmployee = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
        displayName: validated.displayName || `${validated.firstName} ${validated.lastName}`,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        jobTitle: true,
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
