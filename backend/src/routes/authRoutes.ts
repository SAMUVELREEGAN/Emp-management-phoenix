import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import {
  changePasswordSchema,
  loginSchema,
  resendVerificationSchema,
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
router.get('/me', authenticate, authController.getMe);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.post('/logout', authenticate, authController.logout);

export default router;
