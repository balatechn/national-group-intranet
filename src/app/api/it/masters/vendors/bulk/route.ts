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
          errors.push(`Vendor "${row.code}": Company code "${row.companyCode}" not found`);
          continue;
        }

        // Check if vendor exists
        const existing = await prisma.vendor.findUnique({
          where: { companyId_code: { companyId: company.id, code: row.code } },
        });

        const vendorData = {
          name: row.name,
          type: row.type || null,
          contactPerson: row.contactPerson || null,
          email: row.email || null,
          phone: row.phone || null,
          address: row.address || null,
          website: row.website || null,
          contractEnd: row.contractEnd ? new Date(row.contractEnd) : null,
          isActive: true,
        };

        if (existing) {
          await prisma.vendor.update({
            where: { id: existing.id },
            data: vendorData,
          });
          updated++;
        } else {
          await prisma.vendor.create({
            data: {
              code: row.code,
              companyId: company.id,
              ...vendorData,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row "${row.code}": ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${created + updated} vendors (${created} created, ${updated} updated)`,
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
