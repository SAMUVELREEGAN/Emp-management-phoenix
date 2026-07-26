import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as attendanceService from '../services/attendanceService';
import * as workReportService from '../services/workReportService';
import { Attendance } from '../models/Attendance';
import { WorkReport } from '../models/WorkReport';
import { startOfDay } from '../utils/dateHelpers';

export const getAdminDashboard = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const summary = await attendanceService.getAttendanceSummary();
    const reportStats = await workReportService.getWorkReportStats();

    const [recentAttendance, recentReports] = await Promise.all([
      Attendance.find({ date: startOfDay() })
        .sort({ checkInTime: -1 })
        .limit(8)
        .populate('employee', 'fullName employeeId department role'),
      WorkReport.find({ status: { $ne: 'draft' } })
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(8)
        .populate('employee', 'fullName employeeId department'),
    ]);

    return sendSuccess(res, 'Admin dashboard fetched successfully', {
      summary: {
        ...summary,
        ...reportStats,
      },
      recentAttendance,
      recentReports,
    });
  },
);

export const getEmployeeDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const employeeId = req.user!._id.toString();
    const todayAttendanceResult = await attendanceService.getTodayAttendance(employeeId);

    const recentReports = await WorkReport.find({ employee: employeeId })
      .sort({ reportDate: -1 })
      .limit(5);

    const today = startOfDay();
    const todayReport = await WorkReport.findOne({
      employee: employeeId,
      reportDate: today,
    });

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);

    const attendanceSummary = await Attendance.aggregate([
      {
        $match: {
          employee: req.user!._id,
          date: { $gte: last30 },
        },
      },
      {
        $group: {
          _id: '$attendanceStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(res, 'Employee dashboard fetched successfully', {
      todayAttendance: todayAttendanceResult.attendance,
      todayReport,
      recentReports,
      attendanceSummary,
    });
  },
);
