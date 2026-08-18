import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as workReportService from '../services/workReportService';

export const createReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
    const report = await workReportService.createWorkReport(
      req.user!._id.toString(),
      req.body,
      attachment,
    );
    return sendSuccess(res, 'Work report saved successfully', { report }, 201);
  },
);

export const createHrAttendanceReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await workReportService.createHrAttendanceReport(
      req.user!._id.toString(),
      req.body,
    );
    return sendSuccess(
      res,
      'Attendance summary report submitted successfully',
      { report },
      201,
    );
  },
);

export const createHourlyReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await workReportService.createHourlyWorkReport(
      req.user!._id.toString(),
      req.body,
    );
    return sendSuccess(res, 'Hourly work report submitted successfully', {
      report,
    }, 201);
  },
);

export const getMyReports = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await workReportService.getMyReports(
      req.user!._id.toString(),
      {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        status: req.query.status as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
        reportType: req.query.reportType as
          | 'daily_work'
          | 'attendance_summary'
          | 'hourly_work'
          | undefined,
      },
    );
    return sendSuccess(res, 'Work reports fetched successfully', result);
  },
);

export const getReportById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await workReportService.getReportById(
      getParam(req.params.id),
      req.user!._id.toString(),
      req.user!.role,
    );
    return sendSuccess(res, 'Work report fetched successfully', { report });
  },
);

export const updateReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
    const report = await workReportService.updateWorkReport(
      getParam(req.params.id),
      req.user!._id.toString(),
      req.body,
      attachment,
    );
    return sendSuccess(res, 'Work report updated successfully', { report });
  },
);

export const submitReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await workReportService.submitWorkReport(
      getParam(req.params.id),
      req.user!._id.toString(),
    );
    return sendSuccess(res, 'Work report submitted successfully', { report });
  },
);

export const listReports = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await workReportService.listWorkReports({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      employeeId: req.query.employeeId as string | undefined,
      search: req.query.search as string | undefined,
      staffRole: req.query.role as 'employee' | 'hr' | undefined,
        reportType: req.query.reportType as
          | 'daily_work'
          | 'attendance_summary'
          | 'hourly_work'
          | undefined,
    });
    return sendSuccess(res, 'Work reports fetched successfully', result);
  },
);

export const reviewReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await workReportService.reviewWorkReport(
      getParam(req.params.id),
      req.user!._id.toString(),
      req.body.status,
      req.body.adminComment,
    );
    return sendSuccess(res, `Work report ${req.body.status} successfully`, {
      report,
    });
  },
);
