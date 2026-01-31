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
        // Find assigned user if provided
        let assignedToId: string | null = null;
        if (row.assignedToEmail) {
          const user = await prisma.user.findUnique({
            where: { email: row.assignedToEmail },
          });
          if (user) {
            assignedToId = user.id;
          }
        }

        // Map type and status
        const typeMap: Record<string, string> = {
          'SMARTPHONE': 'SMARTPHONE',
          'TABLET': 'TABLET',
          'FEATURE_PHONE': 'FEATURE_PHONE',
        };
        const type = typeMap[row.type?.toUpperCase()] || 'SMARTPHONE';

        const statusMap: Record<string, string> = {
          'AVAILABLE': 'AVAILABLE',
          'ASSIGNED': 'ASSIGNED',
          'UNDER_MAINTENANCE': 'UNDER_MAINTENANCE',
          'RETIRED': 'RETIRED',
          'DISPOSED': 'DISPOSED',
        };
        const status = statusMap[row.status?.toUpperCase()] || 'AVAILABLE';

        // Check if mobile exists
        const existing = await prisma.mobileDevice.findUnique({
          where: { assetTag: row.assetTag },
        });

        const mobileData = {
          name: row.name,
          type: type as any,
          manufacturer: row.manufacturer || null,
          model: row.model || null,
          serialNumber: row.serialNumber || null,
          imei: row.imei || null,
          phoneNumber: row.phoneNumber || null,
          carrier: row.carrier || null,
          operatingSystem: row.operatingSystem || null,
          purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
          warrantyExpiry: row.warrantyExpiry ? new Date(row.warrantyExpiry) : null,
          purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : null,
          status: status as any,
          assignedToId,
        };

        if (existing) {
          await prisma.mobileDevice.update({
            where: { assetTag: row.assetTag },
            data: mobileData,
          });
          updated++;
        } else {
          await prisma.mobileDevice.create({
            data: {
              assetTag: row.assetTag,
              ...mobileData,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row "${row.assetTag}": ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${created + updated} mobile devices (${created} created, ${updated} updated)`,
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
