import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as taskService from '../services/taskService';

export const assignTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.assignTask(req.user!._id.toString(), req.body);
  return sendSuccess(res, 'Task assigned successfully', { task }, 201);
});

export const listTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await taskService.listTasks({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as string | undefined,
    employeeId: req.query.employeeId as string | undefined,
    search: req.query.search as string | undefined,
  });
  return sendSuccess(res, 'Tasks fetched successfully', result);
});

export const getMyTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await taskService.getMyTasks(req.user!._id.toString(), {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as string | undefined,
  });
  return sendSuccess(res, 'Tasks fetched successfully', result);
});

export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.getTaskById(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.user!.role,
  );
  return sendSuccess(res, 'Task fetched successfully', { task });
});

export const submitTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.submitTask(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.body,
  );
  return sendSuccess(res, 'Task submitted successfully', { task });
});

export const getTaskStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await taskService.getTaskStats();
  return sendSuccess(res, 'Task stats fetched successfully', { stats });
});
