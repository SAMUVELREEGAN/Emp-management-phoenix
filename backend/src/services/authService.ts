import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types';
import {
  isEmailIdentifier,
  phoneLookupKey,
} from '../utils/phoneHelpers';
import {
  sendVerificationCode,
  verifyUserCode,
} from './verificationService';
import type { VerificationChannel } from '../models/VerificationCode';
import { requiresAccountVerification } from '../utils/roleHelpers';

export const signToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const findUserByIdentifier = async (
  identifier: string,
): Promise<IUser | null> => {
  const trimmed = identifier.trim();

  if (isEmailIdentifier(trimmed)) {
    return User.findOne({ email: trimmed.toLowerCase() }).select('+password');
  }

  const lookupKey = phoneLookupKey(trimmed);
  if (lookupKey.length < 10) {
    return null;
  }

  return User.findOne({
    $or: [{ phoneNormalized: lookupKey }, { phoneNormalized: { $regex: `${lookupKey}$` } }],
  }).select('+password');
};

const resolveVerificationChannel = (
  identifier: string,
): VerificationChannel =>
  isEmailIdentifier(identifier.trim()) ? 'email' : 'sms';

export const loginUser = async (identifier: string, password: string) => {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const pendingActivation = requiresAccountVerification(user);

  if (pendingActivation) {
    const channel = resolveVerificationChannel(identifier);
    const verification = await sendVerificationCode(user, channel);

    return {
      requiresVerification: true as const,
      channel: verification.channel,
      maskedDestination: verification.maskedDestination,
      identifier: identifier.trim(),
      expiresInMinutes: verification.expiresInMinutes,
      ...(verification.devCode ? { devCode: verification.devCode } : {}),
    };
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('Your account is inactive. Contact admin.');
  }

  const token = signToken(user);

  return {
    requiresVerification: false as const,
    user: user.toJSON(),
    token,
  };
};

export const verifyLoginCode = async (
  identifier: string,
  code: string,
) => {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  if (!requiresAccountVerification(user)) {
    throw ApiError.badRequest('Account verification is not required');
  }

  const channel = resolveVerificationChannel(identifier);
  const verifiedUser = await verifyUserCode(user, channel, code);
  const token = signToken(verifiedUser);

  return {
    user: verifiedUser.toJSON(),
    token,
  };
};

export const resendVerificationCode = async (identifier: string) => {
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw ApiError.notFound('Account not found');
  }

  if (!requiresAccountVerification(user)) {
    throw ApiError.badRequest('Verification is not required for this account');
  }

  const channel = resolveVerificationChannel(identifier);
  const verification = await sendVerificationCode(user, channel);

  return {
    channel: verification.channel,
    maskedDestination: verification.maskedDestination,
    expiresInMinutes: verification.expiresInMinutes,
    ...(verification.devCode ? { devCode: verification.devCode } : {}),
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
};
