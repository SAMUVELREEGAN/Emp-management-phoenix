import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import {
  createPayrollRunSchema,
  paginationSchema,
  setCompensationSchema,
  updatePayrollPolicySchema,
} from '../validators/schemas';
import * as payrollController from '../controllers/payrollController';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'hr'), payrollController.getSummary);
router.get('/policy', authorize('admin', 'hr'), payrollController.getPolicy);
router.put('/policy', authorize('admin'), validate(updatePayrollPolicySchema), payrollController.updatePolicy);

router.get(
  '/compensation/:employeeId',
  authorize('admin', 'hr'),
  payrollController.getCompensation,
);
router.put(
  '/compensation/:employeeId',
  authorize('admin', 'hr'),
  validate(setCompensationSchema),
  payrollController.setCompensation,
);

router.post('/runs', authorize('admin', 'hr'), validate(createPayrollRunSchema), payrollController.createRun);
router.get('/runs', authorize('admin', 'hr'), validate(paginationSchema, 'query'), payrollController.listRuns);
router.get('/runs/:id', authorize('admin', 'hr'), payrollController.getRun);
router.post('/runs/:id/generate', authorize('admin', 'hr'), payrollController.generateRun);
router.post('/runs/:id/finalize', authorize('admin', 'hr'), payrollController.finalizeRun);

router.get('/payslips/my', authorize('employee'), validate(paginationSchema, 'query'), payrollController.listMyPayslips);
router.get('/payslips/:id', authorize('admin', 'hr', 'employee'), payrollController.getPayslip);
router.get('/payslips/:id/download', authorize('admin', 'hr', 'employee'), payrollController.downloadPayslip);

export default router;
