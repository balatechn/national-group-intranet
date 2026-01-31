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
        // Find vendor if provided
        let vendorId: string | null = null;
        if (row.vendorCode) {
          const vendor = await prisma.vendor.findFirst({
            where: { code: row.vendorCode },
          });
          if (vendor) {
            vendorId = vendor.id;
          }
        }

        // Map license type
        const licenseTypeMap: Record<string, string> = {
          'PERPETUAL': 'PERPETUAL',
          'SUBSCRIPTION': 'SUBSCRIPTION',
          'FREE': 'FREE',
          'TRIAL': 'TRIAL',
        };
        const licenseType = licenseTypeMap[row.licenseType?.toUpperCase()] || 'SUBSCRIPTION';

        // Check if software exists
        const existing = await prisma.software.findUnique({
          where: { id: row.id },
        });

        const softwareData = {
          name: row.name,
          version: row.version || null,
          licenseType: licenseType as any,
          totalLicenses: row.totalLicenses ? parseInt(row.totalLicenses) : 0,
          usedLicenses: row.usedLicenses ? parseInt(row.usedLicenses) : 0,
          licenseKey: row.licenseKey || null,
          purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : null,
          vendorId,
          isActive: true,
        };

        if (existing) {
          await prisma.software.update({
            where: { id: row.id },
            data: softwareData,
          });
          updated++;
        } else {
          await prisma.software.create({
            data: {
              id: row.id,
              ...softwareData,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row "${row.id}": ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${created + updated} software (${created} created, ${updated} updated)`,
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
