import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

const APP_NAME = 'National Group Intranet';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sharepoint.nationalgroupindia.com';

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

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSmtpConfig();

    if (!config.enabled) {
      console.warn('[Email] SMTP not enabled, skipping email send');
      return { success: true };
    }

    if (!config.user || !config.pass) {
      console.warn('[Email] SMTP credentials not configured');
      return { success: false, error: 'SMTP credentials not configured' };
    }

    const transporter = createTransporter(config);

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
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

// Send test email
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `[Test] ${APP_NAME} - Email Configuration Test`,
    html: getBaseEmailTemplate(
      'Email Test Successful',
      `
        <h2>Hello!</h2>
        <p>This is a test email from <strong>${APP_NAME}</strong>.</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <p style="color: #22c55e; font-weight: bold;">✅ Email delivery is active</p>
      `
    ),
  });
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
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #070B47 0%, #1a237e 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header .subtitle { font-size: 12px; opacity: 0.8; margin-top: 5px; }
        .content { padding: 30px; }
        .content h2 { color: #070B47; margin-top: 0; }
        .btn { display: inline-block; background-color: #C8A951; color: #070B47; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .btn:hover { background-color: #b8993e; }
        .info-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .alert-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .success-box { background-color: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .danger-box { background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
        .footer a { color: #070B47; text-decoration: none; }
        .divider { border: none; border-top: 1px solid #e9ecef; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1>${APP_NAME}</h1>
          <div class="subtitle">Enterprise Intranet Portal</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from ${APP_NAME}.</p>
          <p>Please do not reply to this email.</p>
          <a href="${APP_URL}">${APP_URL}</a>
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
