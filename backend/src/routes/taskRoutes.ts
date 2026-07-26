import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import {
  assignTaskSchema,
  submitTaskSchema,
  paginationSchema,
} from '../validators/schemas';
import * as taskController from '../controllers/taskController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin'),
  validate(assignTaskSchema),
  taskController.assignTask,
);
router.get('/stats', authorize('admin'), taskController.getTaskStats);
router.get('/my-tasks', authorize('employee'), taskController.getMyTasks);
router.get('/', authorize('admin'), validate(paginationSchema, 'query'), taskController.listTasks);
router.get('/:id', taskController.getTaskById);
router.patch(
  '/:id/submit',
  authorize('employee'),
  validate(submitTaskSchema),
  taskController.submitTask,
);

export default router;
