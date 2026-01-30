import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        code: true,
        description: true,
        logo: true,
        website: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
