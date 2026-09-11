import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as shiftService from '../services/shiftService';

export const createShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shift = await shiftService.createShift(req.user!._id.toString(), req.body);
  return sendSuccess(res, 'Shift created successfully', { shift }, 201);
});

export const listActiveShifts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.listShifts({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 100,
    search: req.query.search as string | undefined,
    activeOnly: true,
  });
  return sendSuccess(res, 'Active shifts fetched successfully', result);
});

export const listShifts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.listShifts({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string | undefined,
    activeOnly: req.query.activeOnly === 'true',
  });
  return sendSuccess(res, 'Shifts fetched successfully', result);
});

export const getShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shift = await shiftService.getShiftById(getParam(req.params.id));
  return sendSuccess(res, 'Shift fetched successfully', { shift });
});

export const updateShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shift = await shiftService.updateShift(getParam(req.params.id), req.body);
  return sendSuccess(res, 'Shift updated successfully', { shift });
});

export const assignShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const assignments = await shiftService.assignShift(req.user!._id.toString(), req.body);
  return sendSuccess(res, 'Shift assigned successfully', { assignments }, 201);
});

export const listAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.listAssignments({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    employeeId: req.query.employeeId as string | undefined,
    shiftId: req.query.shiftId as string | undefined,
  });
  return sendSuccess(res, 'Shift assignments fetched successfully', result);
});

export const getMyShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await shiftService.getMyShift(req.user!._id.toString());
  return sendSuccess(res, 'Shift fetched successfully', data);
});

export const createChangeRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await shiftService.createChangeRequest(req.user!._id.toString(), req.body);
  return sendSuccess(res, 'Shift change request submitted', { request }, 201);
});

export const listChangeRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.listChangeRequests({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    status: req.query.status as string | undefined,
    employeeId: req.query.employeeId as string | undefined,
  });
  return sendSuccess(res, 'Shift change requests fetched successfully', result);
});

export const getMyChangeRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.getMyChangeRequests(req.user!._id.toString(), {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    status: req.query.status as string | undefined,
  });
  return sendSuccess(res, 'Shift change requests fetched successfully', result);
});

export const getChangeRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await shiftService.getChangeRequestById(getParam(req.params.id), {
    id: req.user!._id.toString(),
    role: req.user!.role,
  });
  return sendSuccess(res, 'Shift change request fetched successfully', { request });
});

export const reviewChangeRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await shiftService.reviewChangeRequest(
    req.user!._id.toString(),
    getParam(req.params.id),
    req.body.status,
    req.body.adminComment,
  );
  return sendSuccess(res, 'Shift change request reviewed successfully', { request });
});

export const cancelChangeRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await shiftService.cancelChangeRequest(
    req.user!._id.toString(),
    getParam(req.params.id),
  );
  return sendSuccess(res, 'Shift change request cancelled successfully', { request });
});

export const getShiftAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await shiftService.getShiftAttendance(
    getParam(req.params.shiftId),
    req.query.date as string,
  );
  return sendSuccess(res, 'Shift attendance fetched successfully', result);
});

export const getShiftStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await shiftService.getShiftStats();
  return sendSuccess(res, 'Shift stats fetched successfully', { stats });
});

export const submitShiftReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await shiftService.submitShiftReport(req.user!._id.toString(), req.body);
  return sendSuccess(res, 'Shift report submitted to admin', { report }, 201);
});

export const listShiftReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const submittedBy =
    req.user!.role === 'hr' ? req.user!._id.toString() : (req.query.submittedBy as string | undefined);

  const result = await shiftService.listShiftReports({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as string | undefined,
    submittedBy,
  });
  return sendSuccess(res, 'Shift reports fetched successfully', result);
});

export const getShiftReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await shiftService.getShiftReportById(getParam(req.params.id));
  return sendSuccess(res, 'Shift report fetched successfully', { report });
});

export const acknowledgeShiftReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await shiftService.acknowledgeShiftReport(
    req.user!._id.toString(),
    getParam(req.params.id),
  );
  return sendSuccess(res, 'Shift report acknowledged successfully', { report });
});
