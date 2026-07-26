import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as leaveService from '../services/leaveService';

export const createLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const leave = await leaveService.createLeaveRequest(
    req.user!._id.toString(),
    req.body,
  );
  return sendSuccess(res, 'Leave request submitted successfully', { leave }, 201);
});

export const previewLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const duration = leaveService.previewLeaveDuration(req.body);
  return sendSuccess(res, 'Leave duration calculated', { duration });
});

export const listLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await leaveService.listLeaveRequests({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as string | undefined,
    employeeId: req.query.employeeId as string | undefined,
  });
  return sendSuccess(res, 'Leave requests fetched successfully', result);
});

export const getMyLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await leaveService.getMyLeaveRequests(req.user!._id.toString(), {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as string | undefined,
  });
  return sendSuccess(res, 'Leave requests fetched successfully', result);
});

export const getLeaveById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const leave = await leaveService.getLeaveById(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.user!.role,
  );
  return sendSuccess(res, 'Leave request fetched successfully', { leave });
});

export const cancelLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const leave = await leaveService.cancelLeaveRequest(
    getParam(req.params.id),
    req.user!._id.toString(),
  );
  return sendSuccess(res, 'Leave request cancelled successfully', { leave });
});

export const reviewLeave = asyncHandler(async (req: AuthRequest, res: Response) => {
  const leave = await leaveService.reviewLeaveRequest(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.body.status,
    req.body.adminComment,
  );
  return sendSuccess(res, 'Leave request reviewed successfully', { leave });
});

export const getLeaveStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await leaveService.getLeaveStats();
  return sendSuccess(res, 'Leave stats fetched successfully', { stats });
});
