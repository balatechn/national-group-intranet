import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Fetch logo only (public endpoint for logo display)
export async function GET() {
  try {
    const logoSetting = await prisma.systemSetting.findUnique({
      where: { key: 'logo' },
    });

    return NextResponse.json({ 
      logo: logoSetting?.value || null 
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json({ logo: null }, { status: 200 });
  }
}
