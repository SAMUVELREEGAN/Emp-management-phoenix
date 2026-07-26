import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get(
  '/admin',
  authorize('admin', 'hr'),
  dashboardController.getAdminDashboard,
);
router.get(
  '/employee',
  authorize('employee', 'hr'),
  dashboardController.getEmployeeDashboard,
);

export default router;
