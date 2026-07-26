import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { createAnnouncementSchema } from '../validators/schemas';
import * as announcementController from '../controllers/announcementController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post(
  '/',
  validate(createAnnouncementSchema),
  announcementController.createAnnouncement,
);

export default router;
