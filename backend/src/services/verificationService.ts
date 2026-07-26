import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { IUser } from '../models/User';
import {
  VerificationChannel,
  VerificationCode,
} from '../models/VerificationCode';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { maskEmail, maskPhone } from '../utils/phoneHelpers';
import { sendOtpEmail } from './emailService';
import { sendOtpSms } from './smsService';

const generateCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

const hashCode = async (code: string): Promise<string> =>
  bcrypt.hash(code, 10);

export const compareCode = async (code: string, hash: string): Promise<boolean> =>
  bcrypt.compare(code, hash);

export const sendVerificationCode = async (
  user: IUser,
  channel: VerificationChannel,
) => {
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.deleteMany({ user: user._id, channel });

  await VerificationCode.create({
    user: user._id,
    codeHash,
    channel,
    expiresAt,
    attempts: 0,
  });

  if (channel === 'email') {
    await sendOtpEmail(user.email, code, user.fullName);
  } else {
    await sendOtpSms(user.phone, code, user.fullName);
  }

  const maskedDestination =
    channel === 'email' ? maskEmail(user.email) : maskPhone(user.phone);

  logger.info(
    `Verification code sent to ${channel} for user ${user.employeeId}`,
  );

  return {
    channel,
    maskedDestination,
    expiresInMinutes: env.OTP_EXPIRY_MINUTES,
    ...(env.NODE_ENV === 'development' ? { devCode: code } : {}),
  };
};

export const verifyUserCode = async (
  user: IUser,
  channel: VerificationChannel,
  code: string,
) => {
  const record = await VerificationCode.findOne({
    user: user._id,
    channel,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest('Verification code expired. Request a new code.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await VerificationCode.deleteMany({ user: user._id, channel });
    throw ApiError.badRequest('Verification code expired. Request a new code.');
  }

  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    await VerificationCode.deleteMany({ user: user._id, channel });
    throw ApiError.badRequest('Too many attempts. Request a new code.');
  }

  const isValid = await compareCode(code, record.codeHash);
  record.attempts += 1;
  await record.save();

  if (!isValid) {
    throw ApiError.badRequest('Invalid verification code');
  }

  await VerificationCode.deleteMany({ user: user._id });

  user.isVerified = true;
  user.status = 'active';
  await user.save();

  return user;
};

