import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { checkInSchema, checkOutSchema, breakActionSchema, attendanceBreakdownSchema, attendanceExportSchema, attendanceCorrectionSchema } from '../validators/schemas';
import * as attendanceController from '../controllers/attendanceController';

const router = Router();

router.use(authenticate);

router.post(
  '/check-in',
  authorize('employee', 'hr'),
  validate(checkInSchema),
  attendanceController.checkIn,
);
router.post(
  '/check-out',
  authorize('employee', 'hr'),
  validate(checkOutSchema),
  attendanceController.checkOut,
);
router.post(
  '/start-break',
  authorize('employee', 'hr'),
  validate(breakActionSchema),
  attendanceController.startBreak,
);
router.post(
  '/end-break',
  authorize('employee', 'hr'),
  validate(breakActionSchema),
  attendanceController.endBreak,
);
router.post(
  '/break/start',
  authorize('employee', 'hr'),
  validate(breakActionSchema),
  attendanceController.startBreak,
);
router.post(
  '/break/end',
  authorize('employee', 'hr'),
  validate(breakActionSchema),
  attendanceController.endBreak,
);
router.get('/today', authorize('employee', 'hr'), attendanceController.getToday);
router.get(
  '/my-history',
  authorize('employee', 'hr'),
  attendanceController.getMyHistory,
);
router.get(
  '/my-monthly-summary',
  authorize('employee', 'hr'),
  attendanceController.getMyMonthlySummary,
);
router.get('/summary', authorize('admin', 'hr'), attendanceController.getSummary);
router.get(
  '/breakdown',
  authorize('admin', 'hr'),
  validate(attendanceBreakdownSchema, 'query'),
  attendanceController.getBreakdown,
);
router.get(
  '/export',
  authorize('admin', 'hr'),
  validate(attendanceExportSchema, 'query'),
  attendanceController.exportReport,
);
router.get('/', authorize('admin', 'hr'), attendanceController.listAttendance);
router.post(
  '/correct',
  authorize('admin', 'hr'),
  validate(attendanceCorrectionSchema),
  attendanceController.correctAttendance,
);
router.get('/:id', authorize('admin', 'hr'), attendanceController.getAttendanceById);

export default router;
