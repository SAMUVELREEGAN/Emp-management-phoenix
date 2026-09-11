import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import {
  assignShiftSchema,
  createShiftChangeRequestSchema,
  createShiftSchema,
  paginationSchema,
  reviewShiftChangeRequestSchema,
  shiftAttendanceQuerySchema,
  submitShiftReportSchema,
  updateShiftSchema,
} from '../validators/schemas';
import * as shiftController from '../controllers/shiftController';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize('admin', 'hr'), shiftController.getShiftStats);
router.get('/my-shift', authorize('employee', 'hr', 'admin'), shiftController.getMyShift);
router.get(
  '/active',
  authorize('employee', 'admin', 'hr'),
  validate(paginationSchema, 'query'),
  shiftController.listActiveShifts,
);

router.get(
  '/assignments/list',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  shiftController.listAssignments,
);
router.post(
  '/assignments',
  authorize('admin', 'hr'),
  validate(assignShiftSchema),
  shiftController.assignShift,
);

router.post(
  '/change-requests',
  authorize('employee'),
  validate(createShiftChangeRequestSchema),
  shiftController.createChangeRequest,
);
router.get(
  '/change-requests/my',
  authorize('employee'),
  validate(paginationSchema, 'query'),
  shiftController.getMyChangeRequests,
);
router.get(
  '/change-requests',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  shiftController.listChangeRequests,
);
router.get('/change-requests/:id', authorize('admin', 'hr', 'employee'), shiftController.getChangeRequest);
router.patch(
  '/change-requests/:id/review',
  authorize('admin', 'hr'),
  validate(reviewShiftChangeRequestSchema),
  shiftController.reviewChangeRequest,
);
router.patch(
  '/change-requests/:id/cancel',
  authorize('employee'),
  shiftController.cancelChangeRequest,
);

router.post(
  '/reports',
  authorize('hr'),
  validate(submitShiftReportSchema),
  shiftController.submitShiftReport,
);
router.get(
  '/reports/list',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  shiftController.listShiftReports,
);
router.get('/reports/:id', authorize('admin', 'hr'), shiftController.getShiftReport);
router.patch(
  '/reports/:id/acknowledge',
  authorize('admin'),
  shiftController.acknowledgeShiftReport,
);

router.get(
  '/',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  shiftController.listShifts,
);
router.post(
  '/',
  authorize('admin', 'hr'),
  validate(createShiftSchema),
  shiftController.createShift,
);

router.get(
  '/:shiftId/attendance',
  authorize('admin', 'hr'),
  validate(shiftAttendanceQuerySchema, 'query'),
  shiftController.getShiftAttendance,
);
router.get('/:id', authorize('admin', 'hr'), shiftController.getShift);
router.put(
  '/:id',
  authorize('admin', 'hr'),
  validate(updateShiftSchema),
  shiftController.updateShift,
);

export default router;
