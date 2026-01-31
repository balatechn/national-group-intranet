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
        // Check if company with code exists
        const existing = await prisma.company.findUnique({
          where: { code: row.code },
        });

        if (existing) {
          // Update existing
          await prisma.company.update({
            where: { code: row.code },
            data: {
              name: row.name,
              shortName: row.shortName || null,
              description: row.description || null,
              website: row.website || null,
              email: row.email || null,
              phone: row.phone || null,
              address: row.address || null,
              city: row.city || null,
              state: row.state || null,
              country: row.country || null,
              postalCode: row.postalCode || null,
              taxId: row.taxId || null,
            },
          });
          updated++;
        } else {
          // Create new
          await prisma.company.create({
            data: {
              code: row.code,
              name: row.name,
              shortName: row.shortName || null,
              description: row.description || null,
              website: row.website || null,
              email: row.email || null,
              phone: row.phone || null,
              address: row.address || null,
              city: row.city || null,
              state: row.state || null,
              country: row.country || null,
              postalCode: row.postalCode || null,
              taxId: row.taxId || null,
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
      message: `Successfully processed ${created + updated} companies (${created} created, ${updated} updated)`,
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
