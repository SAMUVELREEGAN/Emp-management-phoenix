import { env } from '../config/env';
import type { VerificationChannel } from '../models/VerificationCode';

export function isEmailOtpConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM,
  );
}

export function isSmsOtpConfigured(): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER,
  );
}

export function isOtpDeliveryConfigured(
  channel: VerificationChannel,
): boolean {
  return channel === 'email' ? isEmailOtpConfigured() : isSmsOtpConfigured();
}
