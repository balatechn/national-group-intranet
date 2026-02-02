import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch settings
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        group: 'branding',
      },
    });

    const result: Record<string, string> = {};
    settings.forEach((setting) => {
      result[setting.key] = setting.value;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const userRole = session.user.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { logo, companyName } = body;

    // Update logo setting
    if (logo !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'logo' },
        update: { value: logo, updatedAt: new Date() },
        create: {
          key: 'logo',
          value: logo,
          description: 'Company logo (base64 encoded)',
          group: 'branding',
        },
      });
    }

    // Update company name setting
    if (companyName !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'companyName' },
        update: { value: companyName, updatedAt: new Date() },
        create: {
          key: 'companyName',
          value: companyName,
          description: 'Company name displayed in the application',
          group: 'branding',
        },
      });
    }

    return NextResponse.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ message: 'Failed to save settings' }, { status: 500 });
  }
}
