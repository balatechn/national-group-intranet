import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
