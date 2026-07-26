import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import {
  createEmployeeSchema,
  paginationSchema,
  statusSchema,
  updateEmployeeSchema,
} from '../validators/schemas';
import * as employeeController from '../controllers/employeeController';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'hr'),
  validate(paginationSchema, 'query'),
  employeeController.getEmployees,
);
router.get('/:id', authorize('admin', 'hr'), employeeController.getEmployee);

router.use(authorize('admin'));

router.post(
  '/',
  upload.single('profilePhoto'),
  validate(createEmployeeSchema),
  employeeController.createEmployee,
);
router.put(
  '/:id',
  upload.single('profilePhoto'),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee,
);
router.patch(
  '/:id/status',
  validate(statusSchema),
  employeeController.updateEmployeeStatus,
);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
