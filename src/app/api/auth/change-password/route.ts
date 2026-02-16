import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { sendEmail, getPasswordChangedEmail, sendAdminAlert, getPasswordChangedAdminAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);
const COOKIE_NAME = 'workos_session';

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true, firstName: true, lastName: true, displayName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password and update
    const newPasswordHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash },
    });

    const userName = user.displayName || `${user.firstName} ${user.lastName}`;

    // Send confirmation email to user
    const userEmail = getPasswordChangedEmail(userName);
    await sendEmail({
      to: user.email,
      subject: userEmail.subject,
      html: userEmail.html,
    });

    // Send alert to admins
    const adminAlert = getPasswordChangedAdminAlert(userName, user.email);
    await sendAdminAlert(adminAlert.subject, `
      <h2>Password Change Notification</h2>
      <div class="info-box">
        <p><strong>User:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    `);

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
