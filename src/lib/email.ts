import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

const APP_NAME = 'National Group Intranet';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sharepoint.nationalgroupindia.com';
const ADMIN_BCC_EMAIL = 'bala@nationalgroupindia.com';

// ==========================================
// SMTP CONFIGURATION (from DB or ENV)
// ==========================================

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group: 'email' },
    });

    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    return {
      host: config['smtp_host'] || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(config['smtp_port'] || process.env.SMTP_PORT || '587'),
      secure: (config['smtp_secure'] || process.env.SMTP_SECURE || 'false') === 'true',
      user: config['smtp_user'] || process.env.SMTP_USER || '',
      pass: config['smtp_pass'] || process.env.SMTP_PASS || '',
      fromEmail: config['smtp_from_email'] || process.env.SMTP_FROM_EMAIL || 'noreply@nationalgroupindia.com',
      fromName: config['smtp_from_name'] || process.env.SMTP_FROM_NAME || APP_NAME,
      enabled: (config['smtp_enabled'] || process.env.SMTP_ENABLED || 'false') === 'true',
    };
  } catch (error) {
    console.error('Error loading SMTP config from DB:', error);
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@nationalgroupindia.com',
      fromName: process.env.SMTP_FROM_NAME || APP_NAME,
      enabled: process.env.SMTP_ENABLED === 'true',
    };
  }
}

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

// ==========================================
// SEND EMAIL
// ==========================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail(options: EmailOptions, force = false): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const config = await getSmtpConfig();

    if (!config.enabled && !force) {
      console.warn('[Email] SMTP not enabled, skipping email send');
      return { success: true, skipped: true };
    }

    if (!config.user || !config.pass) {
      console.warn('[Email] SMTP credentials not configured');
      return { success: false, error: 'SMTP credentials not configured' };
    }

    const transporter = createTransporter(config);

    // Collect all recipient addresses to avoid duplicating BCC
    const allRecipients = new Set<string>();
    const addToSet = (addr: string | string[] | undefined) => {
      if (!addr) return;
      const list = Array.isArray(addr) ? addr : [addr];
      list.forEach((e) => allRecipients.add(e.toLowerCase().trim()));
    };
    addToSet(options.to);
    addToSet(options.cc);
    addToSet(options.bcc);

    // Auto-BCC admin if not already a recipient
    let bccList = options.bcc ? (Array.isArray(options.bcc) ? [...options.bcc] : [options.bcc]) : [];
    if (!allRecipients.has(ADMIN_BCC_EMAIL.toLowerCase())) {
      bccList.push(ADMIN_BCC_EMAIL);
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: bccList.length > 0 ? bccList.join(', ') : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[Email] Sent successfully:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

// Test SMTP connection
export async function testSmtpConnection(config?: Partial<SmtpConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultConfig = await getSmtpConfig();
    const testConfig = { ...defaultConfig, ...config };

    if (!testConfig.user || !testConfig.pass) {
      return { success: false, error: 'SMTP user and password are required' };
    }

    const transporter = createTransporter(testConfig);
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send test email (always force-sends, bypasses enabled check)
export async function sendTestEmail(to: string, smtpOverride?: { host: string; port: number; secure: boolean; user: string; pass: string; fromEmail: string; fromName: string }): Promise<{ success: boolean; error?: string }> {
  try {
    let config: SmtpConfig;
    if (smtpOverride) {
      config = { ...smtpOverride, enabled: true };
    } else {
      config = await getSmtpConfig();
    }

    if (!config.user || !config.pass) {
      return { success: false, error: 'SMTP username and password are required' };
    }

    const transporter = createTransporter(config);

    const info = await transporter.sendMail({
      from: `"${config.fromName || APP_NAME}" <${config.fromEmail || config.user}>`,
      to,
      subject: `[Test] ${APP_NAME} - Email Configuration Test`,
      html: getBaseEmailTemplate(
        'Email Test Successful',
        `
          <h2>Hello!</h2>
          <p>This is a test email from <strong>${APP_NAME}</strong>.</p>
          <p>If you received this email, your SMTP configuration is working correctly.</p>
          <p style="color: #22c55e; font-weight: bold;">✅ Email delivery is active</p>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        `
      ),
    });

    console.log('[Email] Test email sent:', info.messageId, 'accepted:', info.accepted, 'rejected:', info.rejected);

    if (info.rejected && info.rejected.length > 0) {
      return { success: false, error: `Email rejected for: ${info.rejected.join(', ')}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Email] Test email failed:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// ALERT HELPERS
// ==========================================

// Send alert to all admins
export async function sendAdminAlert(subject: string, htmlBody: string) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] },
        status: 'ACTIVE',
      },
      select: { email: true },
    });

    if (admins.length === 0) return;

    const adminEmails = admins.map((a) => a.email);
    await sendEmail({
      to: adminEmails,
      subject: `[Admin Alert] ${subject}`,
      html: getBaseEmailTemplate('Admin Alert', htmlBody),
    });
  } catch (error) {
    console.error('[Email] Failed to send admin alert:', error);
  }
}

// Notify a specific user
export async function notifyUser(userId: string, subject: string, htmlBody: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (!user) return;

    await sendEmail({
      to: user.email,
      subject,
      html: getBaseEmailTemplate(subject, htmlBody),
    });
  } catch (error) {
    console.error('[Email] Failed to notify user:', error);
  }
}

// ==========================================
// BASE EMAIL TEMPLATE
// ==========================================

function getBaseEmailTemplate(title: string, content: string): string {
  const LOGO_URL = `${APP_URL}/national-logo.png`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #FDF8E8; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #070B47 0%, #0d1266 50%, #070B47 100%); padding: 32px 30px; text-align: center; }
        .header-logo { margin-bottom: 12px; }
        .header-logo img { height: 52px; width: auto; }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; color: #C8A951; font-weight: 600; }
        .header .subtitle { font-size: 11px; color: rgba(200,169,81,0.7); margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .gold-bar { height: 4px; background: linear-gradient(90deg, #B8860B 0%, #DAA520 35%, #FFD700 50%, #DAA520 65%, #B8860B 100%); }
        .content { padding: 32px 30px; }
        .content h2 { color: #070B47; margin-top: 0; font-size: 20px; }
        .content p { color: #444; font-size: 14px; line-height: 1.7; }
        .btn { display: inline-block; background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%); color: #ffffff !important; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; font-size: 14px; }
        .info-box { background-color: #FDF8E8; border: 1px solid #F0D275; border-left: 4px solid #B8860B; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .info-box p { margin: 4px 0; color: #333; }
        .alert-box { background-color: #FFF8E1; border: 1px solid #FFE082; border-left: 4px solid #FFA000; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .success-box { background-color: #E8F5E9; border: 1px solid #A5D6A7; border-left: 4px solid #43A047; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .danger-box { background-color: #FFEBEE; border: 1px solid #EF9A9A; border-left: 4px solid #E53935; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { background: linear-gradient(180deg, #f8f6f0 0%, #f0ece0 100%); padding: 24px 30px; text-align: center; border-top: 1px solid #e8e0cc; }
        .footer p { font-size: 12px; color: #888; margin: 4px 0; }
        .footer a { color: #B8860B; text-decoration: none; font-weight: 500; }
        .footer-logo { margin-bottom: 8px; }
        .footer-logo img { height: 24px; width: auto; opacity: 0.5; }
        .divider { border: none; border-top: 1px solid #f0e8d8; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div style="padding: 24px 16px; background-color: #FDF8E8;">
        <div class="email-wrapper">
          <div class="header">
            <div class="header-logo">
              <img src="${LOGO_URL}" alt="National Group" height="52" style="height: 52px; width: auto;" />
            </div>
            <h1>${APP_NAME}</h1>
            <div class="subtitle">Enterprise Intranet Portal</div>
          </div>
          <div class="gold-bar"></div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This is an automated message from <strong>${APP_NAME}</strong>.</p>
            <p>Please do not reply to this email.</p>
            <p style="margin-top: 12px;"><a href="${APP_URL}">${APP_URL}</a></p>
            <p style="margin-top: 8px; font-size: 10px; color: #aaa;">&copy; ${new Date().getFullYear()} National Group. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==========================================
// NOTIFICATION EMAIL TEMPLATES
// ==========================================

export function getPasswordChangedEmail(userName: string): { subject: string; html: string } {
  return {
    subject: `Password Changed - ${APP_NAME}`,
    html: getBaseEmailTemplate(
      'Password Changed',
      `
        <h2>Hello ${userName},</h2>
        <p>Your password has been changed successfully.</p>
        <div class="info-box">
          <strong>🔒 Security Notice</strong>
          <p style="margin: 5px 0 0 0;">If you did not make this change, please contact your administrator immediately.</p>
        </div>
        <p style="font-size: 13px; color: #666;">Changed at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      `
    ),
  };
}

export function getPasswordChangedAdminAlert(userName: string, userEmail: string): { subject: string; html: string } {
  return {
    subject: `Password Changed by ${userName}`,
    html: getBaseEmailTemplate(
      'Admin Alert: Password Change',
      `
        <h2>Password Change Notification</h2>
        <div class="info-box">
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <p>The above user has changed their password.</p>
      `
    ),
  };
}

export function getNewUserWelcomeEmail(
  userName: string,
  email: string,
  tempPassword: string
): { subject: string; html: string } {
  return {
    subject: `Welcome to ${APP_NAME}`,
    html: getBaseEmailTemplate(
      'Welcome',
      `
        <h2>Welcome, ${userName}!</h2>
        <p>Your account has been created on <strong>${APP_NAME}</strong>.</p>
        <div class="info-box">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <div class="alert-box">
          <strong>⚠️ Important:</strong> Please change your password after your first login.
        </div>
        <a href="${APP_URL}/login" class="btn">Login Now</a>
      `
    ),
  };
}

export function getUserLoginAlert(userName: string, userEmail: string, ip?: string): { subject: string; html: string } {
  return {
    subject: `Login Alert: ${userName}`,
    html: getBaseEmailTemplate(
      'Login Alert',
      `
        <h2>Login Detected</h2>
        <div class="info-box">
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          ${ip ? `<p><strong>IP Address:</strong> ${ip}</p>` : ''}
        </div>
      `
    ),
  };
}

export function getGenericAlertEmail(
  recipientName: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): { subject: string; html: string } {
  return {
    subject: `${title} - ${APP_NAME}`,
    html: getBaseEmailTemplate(
      title,
      `
        <h2>Hello ${recipientName},</h2>
        <p>${message}</p>
        ${actionUrl ? `<a href="${actionUrl}" class="btn">${actionLabel || 'View Details'}</a>` : ''}
      `
    ),
  };
}
