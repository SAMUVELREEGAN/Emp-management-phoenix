import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as geocodeController from '../controllers/geocodeController';

const router = Router();

router.use(authenticate);
router.get(
  '/reverse',
  authorize('employee', 'hr', 'admin'),
  geocodeController.reverseGeocode,
);

export default router;
