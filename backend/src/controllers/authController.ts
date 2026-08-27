import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as authService from '../services/authService';
import * as verificationService from '../services/verificationService';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, password } = req.body;
  const result = await authService.loginUser(identifier, password);

  if (result.requiresVerification) {
    return sendSuccess(res, 'Verification code sent', result);
  }

  return sendSuccess(res, 'Login successful', {
    user: result.user,
    token: result.token,
  });
});

export const verifyCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, code } = req.body;
  const result = await authService.verifyLoginCode(identifier, code);
  return sendSuccess(res, 'Account activated successfully', result);
});

export const resendVerification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { identifier } = req.body;
    const result = await authService.resendVerificationCode(identifier);
    return sendSuccess(res, 'Verification code resent', result);
  },
);

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const result = await verificationService.sendPasswordResetCode(email);
  return sendSuccess(
    res,
    'If an account exists for this email, a password reset code has been sent.',
    result,
  );
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, code, newPassword } = req.body;
  await verificationService.resetPasswordWithCode(email, code, newPassword);
  return sendSuccess(res, 'Password reset successfully. You can now sign in with your new password.');
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return sendSuccess(res, 'Profile fetched successfully', { user });
});

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(
      req.user!._id.toString(),
      currentPassword,
      newPassword,
    );
    return sendSuccess(res, 'Password changed successfully');
  },
);

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
  const user = await authService.updateProfile(
    req.user!._id.toString(),
    { fullName: req.body.fullName },
    profilePhoto,
  );
  return sendSuccess(res, 'Profile updated successfully', { user: user.toJSON() });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  return sendSuccess(res, 'Logged out successfully');
});
