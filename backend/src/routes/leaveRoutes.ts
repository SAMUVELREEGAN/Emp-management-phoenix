import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import {
  createLeaveSchema,
  leavePreviewSchema,
  reviewLeaveSchema,
  paginationSchema,
} from '../validators/schemas';
import * as leaveController from '../controllers/leaveController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('employee'),
  validate(createLeaveSchema),
  leaveController.createLeave,
);
router.post(
  '/preview',
  authorize('employee', 'admin', 'hr'),
  validate(leavePreviewSchema),
  leaveController.previewLeave,
);
router.get('/stats', authorize('admin', 'hr'), leaveController.getLeaveStats);
router.get(
  '/my-requests',
  authorize('employee'),
  validate(paginationSchema, 'query'),
  leaveController.getMyLeave,
);
router.get(
  '/',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  leaveController.listLeave,
);
router.get('/:id', leaveController.getLeaveById);
router.patch(
  '/:id/cancel',
  authorize('employee'),
  leaveController.cancelLeave,
);
router.patch(
  '/:id/review',
  authorize('admin'),
  validate(reviewLeaveSchema),
  leaveController.reviewLeave,
);

export default router;
