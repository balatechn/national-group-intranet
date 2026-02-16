import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { testSmtpConnection, sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);
const COOKIE_NAME = 'workos_session';

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;
    return session?.user || null;
  } catch {
    return null;
  }
}

// GET - Fetch email settings
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany({
      where: { group: 'email' },
    });

    const config: Record<string, string> = {};
    settings.forEach((s) => {
      // Mask the password
      if (s.key === 'smtp_pass' && s.value) {
        config[s.key] = '••••••••';
      } else {
        config[s.key] = s.value;
      }
    });

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Save email settings
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...settings } = body;

    // Handle test actions
    if (action === 'test-connection') {
      const result = await testSmtpConnection({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port || '587'),
        secure: settings.smtp_secure === 'true',
        user: settings.smtp_user,
        pass: settings.smtp_pass === '••••••••' ? await getActualPassword() : settings.smtp_pass,
      });
      return NextResponse.json(result);
    }

    if (action === 'send-test') {
      const testTo = settings.test_email || user.email;
      // First save settings, then send test
      await saveEmailSettings(settings);
      const result = await sendTestEmail(testTo);
      return NextResponse.json(result);
    }

    // Save settings
    await saveEmailSettings(settings);

    return NextResponse.json({ success: true, message: 'Email settings saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getActualPassword(): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'smtp_pass' },
  });
  return setting?.value || '';
}

async function saveEmailSettings(settings: Record<string, string>) {
  const emailKeys = [
    'smtp_enabled',
    'smtp_host',
    'smtp_port',
    'smtp_secure',
    'smtp_user',
    'smtp_pass',
    'smtp_from_email',
    'smtp_from_name',
  ];

  for (const key of emailKeys) {
    if (settings[key] !== undefined) {
      // Skip saving masked password
      if (key === 'smtp_pass' && settings[key] === '••••••••') continue;

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: settings[key] },
        create: {
          key,
          value: settings[key],
          group: 'email',
          description: getSettingDescription(key),
        },
      });
    }
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    smtp_enabled: 'Enable/disable email notifications',
    smtp_host: 'SMTP server hostname',
    smtp_port: 'SMTP server port',
    smtp_secure: 'Use SSL/TLS connection',
    smtp_user: 'SMTP authentication username/email',
    smtp_pass: 'SMTP authentication password/app password',
    smtp_from_email: 'From email address',
    smtp_from_name: 'From display name',
  };
  return descriptions[key] || key;
}
