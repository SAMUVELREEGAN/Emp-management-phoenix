import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as routeService from '../services/routeService';

export const appendPoints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await routeService.appendPointsForEmployee(
    req.user!._id.toString(),
    req.body.points,
  );
  return sendSuccess(res, 'Route points recorded', { session });
});

export const getMyActiveSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const session = await routeService.getMyActiveSession(req.user!._id.toString());
    return sendSuccess(res, 'Active route session fetched', { session });
  },
);

export const getLive = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const live = await routeService.getLiveTracking();
  return sendSuccess(res, 'Live tracking fetched', { live });
});

export const listEmployees = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const employees = await routeService.listTrackableEmployees();
  return sendSuccess(res, 'Trackable employees fetched', { employees });
});

export const getEmployeeToday = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employeeId = getParam(req.params.employeeId);
    const route = await routeService.getEmployeeTodayRoute(employeeId);
    return sendSuccess(res, 'Today route fetched', route);
  },
);

export const getEmployeeHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employeeId = getParam(req.params.employeeId);
    const result = await routeService.getRouteHistory(
      employeeId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    return sendSuccess(res, 'Route history fetched', result);
  },
);

export const getSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const route = await routeService.getSessionRoute(getParam(req.params.sessionId));
  return sendSuccess(res, 'Route session fetched', route);
});

export const getHistoryByDate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employeeId = getParam(req.params.employeeId);
    const date = req.query.date as string;
    const route = await routeService.getHistoryByDate(employeeId, date);
    return sendSuccess(res, 'Route fetched for date', route);
  },
);
