import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const APP_NAME = 'Employee Management';

function isEmailConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM,
  );
}

export function isEmailOtpConfigured(): boolean {
  return isEmailConfigured();
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(
  email: string,
  code: string,
  fullName: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn(`[EMAIL OTP - not configured] To: ${email} | Code: ${code}`);
    return;
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: `${APP_NAME} - Verification Code`,
    text: [
      `Hello ${fullName},`,
      '',
      `Your ${APP_NAME} verification code is: ${code}`,
      '',
      `This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
      'If you did not request this, please ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
        <p>Hello ${fullName},</p>
        <p>Your <strong>${APP_NAME}</strong> verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
        <p>This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color:#666;font-size:13px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  logger.info(`Verification email sent to ${email}`);
}
