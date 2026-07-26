import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import {
  reviewReportSchema,
  workReportSchema,
  hrAttendanceReportSchema,
} from '../validators/schemas';
import * as workReportController from '../controllers/workReportController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('employee'),
  upload.single('attachment'),
  validate(workReportSchema),
  workReportController.createReport,
);
router.get(
  '/my-reports',
  authorize('employee', 'hr'),
  workReportController.getMyReports,
);
router.post(
  '/hr-attendance-summary',
  authorize('hr'),
  validate(hrAttendanceReportSchema),
  workReportController.createHrAttendanceReport,
);
router.get('/', authorize('admin', 'hr'), workReportController.listReports);
router.get('/:id', workReportController.getReportById);
router.put(
  '/:id',
  authorize('employee'),
  upload.single('attachment'),
  validate(workReportSchema),
  workReportController.updateReport,
);
router.patch(
  '/:id/submit',
  authorize('employee'),
  workReportController.submitReport,
);
router.patch(
  '/:id/review',
  authorize('admin', 'hr'),
  validate(reviewReportSchema),
  workReportController.reviewReport,
);

export default router;
