import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    for (const row of data) {
      try {
        // Find company by code
        const company = await prisma.company.findUnique({
          where: { code: row.companyCode },
        });

        if (!company) {
          errors.push(`Department "${row.code}": Company code "${row.companyCode}" not found`);
          continue;
        }

        // Check if department exists
        const existing = await prisma.department.findUnique({
          where: { companyId_code: { companyId: company.id, code: row.code } },
        });

        if (existing) {
          await prisma.department.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              description: row.description || null,
            },
          });
          updated++;
        } else {
          await prisma.department.create({
            data: {
              code: row.code,
              name: row.name,
              description: row.description || null,
              companyId: company.id,
              isActive: true,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row with code "${row.code}": ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${created + updated} departments (${created} created, ${updated} updated)`,
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
