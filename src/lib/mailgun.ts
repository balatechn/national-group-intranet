import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'noreply@nationalgroup.com';
const APP_NAME = process.env.APP_NAME || 'National Group Intranet';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateVariables?: Record<string, string>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const messageData: Record<string, unknown> = {
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
    };

    if (options.template) {
      messageData.template = options.template;
      messageData['h:X-Mailgun-Variables'] = JSON.stringify(options.templateVariables || {});
    } else if (options.html) {
      messageData.html = options.html;
    } else if (options.text) {
      messageData.text = options.text;
    }

    await mg.messages.create(DOMAIN, messageData);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ==========================================
// EMAIL TEMPLATES
// ==========================================

export function getTaskAssignedEmail(
  assigneeName: string,
  taskTitle: string,
  taskUrl: string,
  dueDate?: string
): { subject: string; html: string } {
  return {
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .button { display: inline-block; background-color: #070B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${assigneeName},</h2>
              <p>A new task has been assigned to you:</p>
              <h3 style="color: #070B47;">${taskTitle}</h3>
              ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
              <a href="${taskUrl}" class="button">View Task</a>
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getTicketCreatedEmail(
  userName: string,
  ticketNumber: string,
  subject: string,
  ticketUrl: string
): { subject: string; html: string } {
  return {
    subject: `IT Ticket Created: ${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .ticket-number { background-color: #e3f2fd; padding: 10px; border-radius: 4px; font-size: 18px; font-weight: bold; }
            .button { display: inline-block; background-color: #070B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Your IT support ticket has been created successfully.</p>
              <p class="ticket-number">Ticket Number: ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p>Our IT team will review your request and respond as soon as possible.</p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getTicketUpdatedEmail(
  userName: string,
  ticketNumber: string,
  status: string,
  ticketUrl: string
): { subject: string; html: string } {
  return {
    subject: `IT Ticket Updated: ${ticketNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .status { background-color: #e3f2fd; padding: 10px; border-radius: 4px; font-weight: bold; }
            .button { display: inline-block; background-color: #070B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Your IT ticket <strong>${ticketNumber}</strong> has been updated.</p>
              <p>New Status: <span class="status">${status}</span></p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getRequestApprovalEmail(
  approverName: string,
  requestNumber: string,
  requestType: string,
  requestorName: string,
  requestUrl: string
): { subject: string; html: string } {
  return {
    subject: `Approval Required: ${requestNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .highlight { background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background-color: #070B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${approverName},</h2>
              <div class="highlight">
                <p>A new IT request requires your approval.</p>
              </div>
              <p><strong>Request Number:</strong> ${requestNumber}</p>
              <p><strong>Type:</strong> ${requestType}</p>
              <p><strong>Requested By:</strong> ${requestorName}</p>
              <a href="${requestUrl}" class="button">Review Request</a>
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getRequestStatusEmail(
  userName: string,
  requestNumber: string,
  status: 'APPROVED' | 'REJECTED',
  comments?: string
): { subject: string; html: string } {
  const statusColor = status === 'APPROVED' ? '#22c55e' : '#ef4444';
  const statusText = status === 'APPROVED' ? 'Approved' : 'Rejected';

  return {
    subject: `IT Request ${statusText}: ${requestNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .status { background-color: ${statusColor}20; color: ${statusColor}; padding: 10px 20px; border-radius: 4px; font-weight: bold; display: inline-block; }
            .comments { background-color: #f1f5f9; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Your IT request <strong>${requestNumber}</strong> has been reviewed.</p>
              <p>Status: <span class="status">${statusText}</span></p>
              ${comments ? `<div class="comments"><strong>Comments:</strong><br>${comments}</div>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getEventReminderEmail(
  userName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation?: string,
  eventUrl?: string
): { subject: string; html: string } {
  return {
    subject: `Event Reminder: ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #070B47; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8f9fa; }
            .event-card { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background-color: #070B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>This is a reminder for an upcoming event:</p>
              <div class="event-card">
                <h3 style="color: #070B47; margin-top: 0;">${eventTitle}</h3>
                <p><strong>📅 Date:</strong> ${eventDate}</p>
                ${eventLocation ? `<p><strong>📍 Location:</strong> ${eventLocation}</p>` : ''}
              </div>
              ${eventUrl ? `<a href="${eventUrl}" class="button">View Event Details</a>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message from ${APP_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
