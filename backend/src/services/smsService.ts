import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { toE164Phone } from '../utils/phoneHelpers';

const APP_NAME = 'Employee Management';

function isSmsConfigured(): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER,
  );
}

export function isSmsOtpConfigured(): boolean {
  return isSmsConfigured();
}

let smsClient: ReturnType<typeof twilio> | null = null;

function getSmsClient() {
  if (!smsClient) {
    smsClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return smsClient;
}

export async function sendOtpSms(
  phone: string,
  code: string,
  fullName: string,
): Promise<void> {
  if (!isSmsConfigured()) {
    logger.warn(`[SMS OTP - not configured] To: ${phone} | Code: ${code}`);
    return;
  }

  const to = toE164Phone(phone, env.SMS_DEFAULT_COUNTRY_CODE);
  const client = getSmsClient();

  await client.messages.create({
    from: env.TWILIO_PHONE_NUMBER,
    to,
    body: `${APP_NAME}: Hello ${fullName}, your verification code is ${code}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
  });

  logger.info(`Verification SMS sent to ${to}`);
}
