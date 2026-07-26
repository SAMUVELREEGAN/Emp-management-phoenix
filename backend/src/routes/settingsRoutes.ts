import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { officeHoursSchema } from '../validators/schemas';
import * as settingsController from '../controllers/settingsController';

const router = Router();

router.use(authenticate);

router.get('/office-hours', settingsController.getOfficeSettings);
router.put(
  '/office-hours',
  authorize('admin'),
  validate(officeHoursSchema),
  settingsController.updateOfficeSettings,
);

export default router;
