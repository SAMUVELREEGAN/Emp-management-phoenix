import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as attendanceService from '../services/attendanceService';
import * as attendanceExportService from '../services/attendanceExportService';

export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attendance = await attendanceService.checkIn(
    req.user!._id.toString(),
    req.body.location,
    req.body.deviceTimestamp,
    req.body.deviceTimezoneOffset,
  );
  return sendSuccess(res, 'Attendance checked in successfully', {
    attendance,
  });
});

export const checkOut = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attendance = await attendanceService.checkOut(
      req.user!._id.toString(),
      req.body.location,
      req.body.deviceTimestamp,
      req.body.earlyCheckoutRemark,
      req.body.deviceTimezoneOffset,
    );
    return sendSuccess(res, 'Attendance checked out successfully', {
      attendance,
    });
  },
);

export const startBreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attendance = await attendanceService.startBreak(
    req.user!._id.toString(),
    req.body.deviceTimestamp,
  );
  return sendSuccess(res, 'Break started successfully', { attendance });
});

export const endBreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attendance = await attendanceService.endBreak(
    req.user!._id.toString(),
    req.body.deviceTimestamp,
  );
  return sendSuccess(res, 'Break ended successfully', { attendance });
});

export const getToday = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await attendanceService.getTodayAttendance(
      req.user!._id.toString(),
    );
    return sendSuccess(res, "Today's attendance fetched successfully", result);
  },
);

export const getMyHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await attendanceService.getMyAttendanceHistory(
      req.user!._id.toString(),
      {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
      },
    );
    return sendSuccess(res, 'Attendance history fetched successfully', result);
  },
);

export const listAttendance = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await attendanceService.listAttendance({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      employeeId: req.query.employeeId as string | undefined,
      attendanceStatus: req.query.attendanceStatus as string | undefined,
      search: req.query.search as string | undefined,
      staffRole: req.query.role as 'employee' | 'hr' | undefined,
    });
    return sendSuccess(res, 'Attendance records fetched successfully', result);
  },
);

export const getAttendanceById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attendance = await attendanceService.getAttendanceById(
      getParam(req.params.id),
    );
    return sendSuccess(res, 'Attendance fetched successfully', { attendance });
  },
);

export const getSummary = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const summary = await attendanceService.getAttendanceSummary(
      req.query.date as string | undefined,
    );
    return sendSuccess(res, 'Attendance summary fetched successfully', {
      summary,
    });
  },
);

export const getBreakdown = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { date, role, category } = req.query as {
      date: string;
      role: 'employee' | 'hr';
      category: attendanceService.AttendanceBreakdownCategory;
    };
    const items = await attendanceService.getAttendanceBreakdown(
      date,
      role,
      category,
    );
    return sendSuccess(res, 'Attendance breakdown fetched successfully', {
      items,
      category,
      date,
      role,
    });
  },
);

export const exportReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { fromDate, toDate, role } = req.query as {
      fromDate: string;
      toDate: string;
      role: 'employee' | 'hr';
    };
    const file = await attendanceExportService.exportAttendanceReport(
      fromDate,
      toDate,
      role,
    );
    return sendSuccess(res, 'Attendance report exported successfully', {
      filename: file.filename,
      mimeType: file.mimeType,
      base64: file.buffer.toString('base64'),
    });
  },
);
