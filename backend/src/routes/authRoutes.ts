import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyCodeSchema,
} from '../validators/schemas';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/verify', validate(verifyCodeSchema), authController.verifyCode);
router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  authController.resendVerification,
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.get('/me', authenticate, authController.getMe);
router.patch(
  '/profile',
  authenticate,
  upload.single('profilePhoto'),
  validate(updateProfileSchema),
  authController.updateProfile,
);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.post('/logout', authenticate, authController.logout);

export default router;
