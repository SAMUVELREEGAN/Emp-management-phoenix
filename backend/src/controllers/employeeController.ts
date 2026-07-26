import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as employeeService from '../services/employeeService';

export const getEmployees = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, status, role } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      role?: 'employee' | 'hr';
    };

    const result = await employeeService.listEmployees({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      role,
      requesterRole: req.user!.role,
    });

    return sendSuccess(res, 'Employees fetched successfully', result);
  },
);

export const getEmployee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.getEmployeeById(
      getParam(req.params.id),
      req.user!.role,
    );
    return sendSuccess(res, 'Employee fetched successfully', { employee });
  },
);

export const createEmployee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const employee = await employeeService.createEmployee(
      req.body,
      profilePhoto,
      req.user!._id.toString(),
    );
    const message =
      employee.role === 'hr'
        ? 'HR account created successfully'
        : 'Employee created successfully';
    return sendSuccess(res, message, { employee }, 201);
  },
);

export const updateEmployee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const employee = await employeeService.updateEmployee(
      getParam(req.params.id),
      req.body,
      profilePhoto,
    );
    return sendSuccess(res, 'Employee updated successfully', { employee });
  },
);

export const updateEmployeeStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.updateEmployeeStatus(
      getParam(req.params.id),
      req.body.status,
    );
    return sendSuccess(res, 'Employee status updated successfully', {
      employee,
    });
  },
);

export const deleteEmployee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await employeeService.deleteEmployee(
      getParam(req.params.id),
      req.user!._id.toString(),
    );
    const message =
      result.role === 'hr'
        ? 'HR account deleted successfully'
        : 'Employee deleted successfully';
    return sendSuccess(res, message);
  },
);
