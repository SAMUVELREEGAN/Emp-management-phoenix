import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { appendRoutePointsSchema, routeHistoryDateSchema } from '../validators/schemas';
import * as routeController from '../controllers/routeController';

const router = Router();

router.use(authenticate);

router.post(
  '/points',
  authorize('employee', 'hr'),
  validate(appendRoutePointsSchema),
  routeController.appendPoints,
);
router.get(
  '/my-session',
  authorize('employee', 'hr'),
  routeController.getMyActiveSession,
);
router.get('/live', authorize('admin'), routeController.getLive);
router.get('/employees', authorize('admin'), routeController.listEmployees);
router.get(
  '/employee/:employeeId/today',
  authorize('admin'),
  routeController.getEmployeeToday,
);
router.get(
  '/employee/:employeeId/history',
  authorize('admin'),
  routeController.getEmployeeHistory,
);
router.get(
  '/employee/:employeeId/date',
  authorize('admin'),
  validate(routeHistoryDateSchema, 'query'),
  routeController.getHistoryByDate,
);
router.get('/session/:sessionId', authorize('admin'), routeController.getSession);

export default router;
