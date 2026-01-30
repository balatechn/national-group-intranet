import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        company: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { company: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
