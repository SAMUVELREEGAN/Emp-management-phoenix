import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import {
  onboardingDocumentSchema,
  onboardingReviewSchema,
  onboardingSalarySchema,
  onboardingUpdateSchema,
  paginationSchema,
} from '../validators/schemas';
import * as onboardingController from '../controllers/onboardingController';

const router = Router();

router.use(authenticate);

router.get('/status', authorize('employee'), onboardingController.getOnboardingStatus);
router.get('/my', authorize('employee'), onboardingController.getMyOnboarding);
router.patch('/my', authorize('employee'), validate(onboardingUpdateSchema), onboardingController.updateMyDetails);
router.post(
  '/documents',
  authorize('employee'),
  upload.single('document'),
  validate(onboardingDocumentSchema),
  onboardingController.uploadDocument,
);
router.post('/submit', authorize('employee'), onboardingController.submitOnboarding);

router.get(
  '/review',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  onboardingController.listForReview,
);
router.get('/salary-roster', authorize('admin'), onboardingController.getSalaryRoster);
router.post('/share-admin', authorize('hr'), onboardingController.shareWithAdmin);
router.get('/employee/:employeeId', authorize('admin', 'hr'), onboardingController.getByEmployee);
router.patch(
  '/employee/:employeeId/review',
  authorize('admin', 'hr'),
  validate(onboardingReviewSchema),
  onboardingController.reviewOnboarding,
);
router.patch(
  '/employee/:employeeId/salary',
  authorize('admin', 'hr'),
  validate(onboardingSalarySchema),
  onboardingController.updateSalary,
);

export default router;
