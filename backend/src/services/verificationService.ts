import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { IUser, User } from '../models/User';
import {
  VerificationChannel,
  VerificationCode,
  VerificationPurpose,
} from '../models/VerificationCode';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { maskEmail, maskPhone } from '../utils/phoneHelpers';
import { sendOtpEmail, sendPasswordResetEmail } from './emailService';
import { sendOtpSms } from './smsService';
import { isOtpDeliveryConfigured } from '../utils/otpConfig';

const generateCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

const hashCode = async (code: string): Promise<string> =>
  bcrypt.hash(code, 10);

export const compareCode = async (code: string, hash: string): Promise<boolean> =>
  bcrypt.compare(code, hash);

export const sendVerificationCode = async (
  user: IUser,
  channel: VerificationChannel,
  purpose: VerificationPurpose = 'activation',
) => {
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.deleteMany({ user: user._id, channel, purpose });

  await VerificationCode.create({
    user: user._id,
    codeHash,
    channel,
    purpose,
    expiresAt,
    attempts: 0,
  });

  if (isOtpDeliveryConfigured(channel)) {
    if (channel === 'email') {
      if (purpose === 'password_reset') {
        await sendPasswordResetEmail(user.email, code, user.fullName);
      } else {
        await sendOtpEmail(user.email, code, user.fullName);
      }
    } else {
      await sendOtpSms(user.phone, code, user.fullName);
    }
  } else {
    logger.warn(
      `${channel.toUpperCase()} OTP delivery is not configured; login code included in API response for demo use`,
    );
  }

  const maskedDestination =
    channel === 'email' ? maskEmail(user.email) : maskPhone(user.phone);

  logger.info(
    `Verification code sent to ${channel} for user ${user.employeeId}`,
  );

  const includeDevCode =
    env.NODE_ENV === 'development' || !isOtpDeliveryConfigured(channel);

  return {
    channel,
    maskedDestination,
    expiresInMinutes: env.OTP_EXPIRY_MINUTES,
    ...(includeDevCode ? { devCode: code } : {}),
  };
};

export const verifyUserCode = async (
  user: IUser,
  channel: VerificationChannel,
  code: string,
  purpose: VerificationPurpose = 'activation',
) => {
  const record = await VerificationCode.findOne({
    user: user._id,
    channel,
    purpose,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest('Verification code expired. Request a new code.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await VerificationCode.deleteMany({ user: user._id, channel, purpose });
    throw ApiError.badRequest('Verification code expired. Request a new code.');
  }

  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    await VerificationCode.deleteMany({ user: user._id, channel, purpose });
    throw ApiError.badRequest('Too many attempts. Request a new code.');
  }

  const isValid = await compareCode(code, record.codeHash);
  record.attempts += 1;
  await record.save();

  if (!isValid) {
    throw ApiError.badRequest('Invalid verification code');
  }

  await VerificationCode.deleteMany({ user: user._id, purpose });

  if (purpose === 'activation') {
    user.isVerified = true;
    user.status = 'active';
    await user.save();
  }

  return user;
};

export const sendPasswordResetCode = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  const maskedDestination = maskEmail(normalizedEmail);

  if (!user) {
    logger.info(`Password reset requested for unknown email: ${normalizedEmail}`);
    return {
      maskedDestination,
      expiresInMinutes: env.OTP_EXPIRY_MINUTES,
    };
  }

  const result = await sendVerificationCode(user, 'email', 'password_reset');
  logger.info(`Password reset code sent for user ${user.employeeId}`);

  return {
    maskedDestination: result.maskedDestination,
    expiresInMinutes: result.expiresInMinutes,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  };
};

export const resetPasswordWithCode = async (
  email: string,
  code: string,
  newPassword: string,
) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw ApiError.badRequest('Invalid email or verification code');
  }

  await verifyUserCode(user, 'email', code, 'password_reset');

  user.password = newPassword;
  await user.save();

  return user;
};

