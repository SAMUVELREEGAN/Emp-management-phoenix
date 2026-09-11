import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { assistantAskSchema } from '../validators/schemas';
import * as assistantController from '../controllers/assistantController';

const router = Router();

router.use(authenticate);

router.get(
  '/questions',
  authorize('employee', 'hr', 'admin'),
  assistantController.getQuestions,
);

router.post(
  '/ask',
  authorize('employee', 'hr', 'admin'),
  validate(assistantAskSchema),
  assistantController.askQuestion,
);

export default router;
