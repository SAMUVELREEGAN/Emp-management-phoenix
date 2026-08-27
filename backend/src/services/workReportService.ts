import { FilterQuery, Types } from 'mongoose';
import path from 'path';
import { WorkReport, IWorkReport } from '../models/WorkReport';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { endOfDay, parseDateOnly } from '../utils/dateHelpers';
import { WorkReportStatus } from '../types';
import { createNotification } from './notificationService';
import { findActiveAdmins, findActiveManagers } from '../utils/roleHelpers';
import { AttendanceSummarySnapshot } from '../models/WorkReport';
import { getOfficeHours } from './officeSettingsService';
import { normalizeReminderIntervalMinutes } from '../utils/reminderInterval';
import { stampGeoLocationOnImage } from './geoStampService';
import { env } from '../config/env';

interface ListFilters {
  page: number;
  limit: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  search?: string;
  staffRole?: 'employee' | 'hr';
  reportType?: 'daily_work' | 'attendance_summary' | 'hourly_work';
}

interface HourlyWorkReportInput {
  workSummary?: string;
  reportPeriodStart?: string;
  reportPeriodEnd?: string;
  workingHours?: number;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  capturedAt?: string;
}

interface WorkReportInput {
  reportDate: string;
  title: string;
  workSummary: string;
  completedTasks?: string;
  pendingTasks?: string;
  blockers?: string;
  tomorrowPlan?: string;
  workingHours: number;
  status?: 'draft' | 'submitted';
}

interface HrAttendanceReportInput {
  reportDate: string;
  workSummary?: string;
  attendanceSummary: AttendanceSummarySnapshot;
  status?: 'draft' | 'submitted';
}

async function notifyReportSubmitted(
  report: IWorkReport,
  submitterRole: 'employee' | 'hr',
) {
  const recipients =
    submitterRole === 'hr'
      ? await findActiveAdmins()
      : await findActiveManagers();

  const title =
    submitterRole === 'hr'
      ? 'HR attendance report submitted'
      : 'New work report submitted';
  const message =
    submitterRole === 'hr'
      ? `${report.title} is awaiting admin review.`
      : `A work report "${report.title}" is awaiting review.`;

  await Promise.all(
    recipients.map((recipient) =>
      createNotification({
        recipient: recipient._id,
        title,
        message,
        type: 'work_report',
        relatedId: report._id,
      }),
    ),
  );
}

async function notifyHourlyReportSubmitted(report: IWorkReport) {
  const recipients = await findActiveManagers();
  const employee = await User.findById(report.employee).select('fullName');
  const employeeName = employee?.fullName || 'An employee';

  await Promise.all(
    recipients.map((recipient) =>
      createNotification({
        recipient: recipient._id,
        title: 'Hourly work report submitted',
        message: `${employeeName} submitted an hourly work report: "${report.title}".`,
        type: 'work_report',
        relatedId: report._id,
      }),
    ),
  );
}

function formatHourlyPeriodLabel(start: Date, end: Date): string {
  const format = (date: Date) =>
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  return `${format(start)} - ${format(end)}`;
}

export const createHourlyWorkReport = async (
  employeeId: string,
  data: HourlyWorkReportInput,
  file?: Express.Multer.File,
) => {
  const employee = await User.findById(employeeId).select('isFieldEmployee role status');
  if (!employee || employee.role !== 'employee' || employee.status !== 'active') {
    throw ApiError.forbidden('Only active employees can submit hourly reports');
  }
  if (!employee.isFieldEmployee) {
    throw ApiError.forbidden('Hourly GeoCam reports are only available for field sales employees');
  }
  if (!file) {
    throw ApiError.badRequest('GeoCam photo is required for hourly field reports');
  }

  const settings = await getOfficeHours();
  const intervalMinutes = normalizeReminderIntervalMinutes(
    settings.hourlyReportReminderIntervalMinutes,
  );
  const now = new Date();
  const periodEnd = data.reportPeriodEnd ? new Date(data.reportPeriodEnd) : now;
  const periodStart = data.reportPeriodStart
    ? new Date(data.reportPeriodStart)
    : new Date(periodEnd.getTime() - intervalMinutes * 60 * 1000);

  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw ApiError.badRequest('Invalid report period');
  }

  const existing = await WorkReport.findOne({
    employee: employeeId,
    reportType: 'hourly_work',
    reportPeriodStart: periodStart,
    status: { $in: ['submitted', 'approved', 'rejected'] },
  });
  if (existing) {
    throw ApiError.conflict('An hourly report for this period was already submitted');
  }

  const capturedAt = data.capturedAt ? new Date(data.capturedAt) : now;
  const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const stampedFilename = `geocam-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const stampedPath = path.join(uploadRoot, stampedFilename);

  await stampGeoLocationOnImage(file.path, stampedPath, {
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    capturedAt: capturedAt.toISOString(),
  });

  const summary = data.workSummary?.trim() || 'Field hourly GeoCam report';
  const report = await WorkReport.create({
    employee: employeeId,
    reportDate: parseDateOnly(periodEnd),
    reportType: 'hourly_work',
    reportPeriodStart: periodStart,
    reportPeriodEnd: periodEnd,
    title: `GeoCam Hourly (${formatHourlyPeriodLabel(periodStart, periodEnd)})`,
    workSummary: summary,
    completedTasks: '',
    pendingTasks: '',
    blockers: '',
    tomorrowPlan: '',
    workingHours: data.workingHours ?? intervalMinutes / 60,
    attachment: `/uploads/${stampedFilename}`,
    geoLocation: {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || '',
      accuracy: data.accuracy,
      capturedAt,
    },
    status: 'submitted',
    submittedAt: now,
  });

  await notifyHourlyReportSubmitted(report);

  return report;
};

export const createWorkReport = async (
  employeeId: string,
  data: WorkReportInput,
  attachment?: string,
) => {
  const reportDate = parseDateOnly(data.reportDate);
  const status: WorkReportStatus = data.status || 'draft';

  if (status === 'submitted') {
    const existing = await WorkReport.findOne({
      employee: employeeId,
      reportDate,
      reportType: 'daily_work',
      status: { $in: ['submitted', 'approved', 'rejected'] },
    });
    if (existing) {
      throw ApiError.conflict(
        'A submitted report already exists for this date',
      );
    }
  }

  const report = await WorkReport.create({
    employee: employeeId,
    reportDate,
    reportType: 'daily_work',
    title: data.title,
    workSummary: data.workSummary,
    completedTasks: data.completedTasks || '',
    pendingTasks: data.pendingTasks || '',
    blockers: data.blockers || '',
    tomorrowPlan: data.tomorrowPlan || '',
    workingHours: Number(data.workingHours),
    attachment: attachment || '',
    status,
    submittedAt: status === 'submitted' ? new Date() : undefined,
  });

  if (status === 'submitted') {
    await notifyReportSubmitted(report, 'employee');
  }

  return report;
};

export const createHrAttendanceReport = async (
  hrId: string,
  data: HrAttendanceReportInput,
) => {
  const user = await User.findById(hrId);
  if (!user || user.role !== 'hr') {
    throw ApiError.forbidden('Only HR users can submit attendance summary reports');
  }

  const reportDate = parseDateOnly(data.reportDate);
  const status: WorkReportStatus = data.status || 'submitted';
  const formattedDate = reportDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const title = `Employee Attendance Report - ${formattedDate}`;
  const summaryText =
    data.workSummary?.trim() ||
    `Present: ${data.attendanceSummary.present}, Absent: ${data.attendanceSummary.absent}, Late: ${data.attendanceSummary.late}, Checked Out: ${data.attendanceSummary.checkedOut}.`;

  if (status === 'submitted') {
    const existing = await WorkReport.findOne({
      employee: hrId,
      reportDate,
      reportType: 'attendance_summary',
      status: { $in: ['submitted', 'approved', 'rejected'] },
    });
    if (existing) {
      throw ApiError.conflict(
        'An attendance summary report has already been submitted for this date',
      );
    }
  }

  const report = await WorkReport.create({
    employee: hrId,
    reportDate,
    reportType: 'attendance_summary',
    title,
    workSummary: summaryText,
    completedTasks: '',
    pendingTasks: '',
    blockers: '',
    tomorrowPlan: '',
    workingHours: 0,
    attendanceSummary: data.attendanceSummary,
    status,
    submittedAt: status === 'submitted' ? new Date() : undefined,
  });

  if (status === 'submitted') {
    await notifyReportSubmitted(report, 'hr');
  }

  return report;
};

export const getMyReports = async (
  employeeId: string,
  filters: ListFilters,
) => {
  const query: FilterQuery<IWorkReport> = { employee: employeeId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.reportType) {
    query.reportType = filters.reportType;
  }

  if (filters.fromDate || filters.toDate) {
    query.reportDate = {};
    if (filters.fromDate) {
      query.reportDate.$gte = parseDateOnly(filters.fromDate);
    }
    if (filters.toDate) {
      query.reportDate.$lte = endOfDay(parseDateOnly(filters.toDate));
    }
  }

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    WorkReport.find(query)
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('reviewedBy', 'fullName'),
    WorkReport.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
};

export const getReportById = async (
  id: string,
  requesterId: string,
  role: string,
) => {
  const report = await WorkReport.findById(id)
    .populate('employee', 'fullName employeeId department designation email')
    .populate('reviewedBy', 'fullName');

  if (!report) {
    throw ApiError.notFound('Work report not found');
  }

  if (role === 'employee') {
    const empId =
      typeof report.employee === 'object' &&
      report.employee !== null &&
      '_id' in report.employee
        ? String((report.employee as { _id: Types.ObjectId })._id)
        : String(report.employee);

    if (empId !== requesterId) {
      throw ApiError.forbidden('You can only view your own reports');
    }
  }

  return report;
};

export const updateWorkReport = async (
  id: string,
  employeeId: string,
  data: WorkReportInput,
  attachment?: string,
) => {
  const report = await WorkReport.findById(id);
  if (!report) {
    throw ApiError.notFound('Work report not found');
  }

  if (report.employee.toString() !== employeeId) {
    throw ApiError.forbidden('You can only edit your own reports');
  }

  if (report.status === 'approved' || report.status === 'rejected') {
    throw ApiError.badRequest('Approved or rejected reports cannot be edited');
  }

  if (data.reportDate) {
    report.reportDate = parseDateOnly(data.reportDate);
  }

  report.title = data.title;
  report.workSummary = data.workSummary;
  report.completedTasks = data.completedTasks || '';
  report.pendingTasks = data.pendingTasks || '';
  report.blockers = data.blockers || '';
  report.tomorrowPlan = data.tomorrowPlan || '';
  report.workingHours = Number(data.workingHours);

  if (attachment) {
    report.attachment = attachment;
  }

  if (data.status === 'submitted') {
    const existing = await WorkReport.findOne({
      employee: employeeId,
      reportDate: report.reportDate,
      status: { $in: ['submitted', 'approved', 'rejected'] },
      _id: { $ne: report._id },
    });
    if (existing) {
      throw ApiError.conflict(
        'A submitted report already exists for this date',
      );
    }
    report.status = 'submitted';
    report.submittedAt = new Date();
  } else if (data.status === 'draft') {
    report.status = 'draft';
  }

  await report.save();
  return report;
};

export const submitWorkReport = async (id: string, employeeId: string) => {
  const report = await WorkReport.findById(id);
  if (!report) {
    throw ApiError.notFound('Work report not found');
  }

  if (report.employee.toString() !== employeeId) {
    throw ApiError.forbidden('You can only submit your own reports');
  }

  if (report.status !== 'draft') {
    throw ApiError.badRequest('Only draft reports can be submitted');
  }

  const existing = await WorkReport.findOne({
    employee: employeeId,
    reportDate: report.reportDate,
    status: { $in: ['submitted', 'approved', 'rejected'] },
    _id: { $ne: report._id },
  });

  if (existing) {
    throw ApiError.conflict('A submitted report already exists for this date');
  }

  report.status = 'submitted';
  report.submittedAt = new Date();
  await report.save();

  const submitter = await User.findById(employeeId).select('role');
  const submitterRole = submitter?.role === 'hr' ? 'hr' : 'employee';
  await notifyReportSubmitted(report, submitterRole);

  return report;
};

export const listWorkReports = async (filters: ListFilters) => {
  const query: FilterQuery<IWorkReport> = {};

  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = { $ne: 'draft' };
  }

  if (filters.reportType) {
    query.reportType = filters.reportType;
  } else if (filters.staffRole === 'employee') {
    query.reportType = 'daily_work';
  } else if (filters.staffRole === 'hr') {
    query.reportType = 'attendance_summary';
  }

  if (filters.employeeId) {
    query.employee = new Types.ObjectId(filters.employeeId);
  } else if (filters.staffRole) {
    const staffIds = await User.find({ role: filters.staffRole }).distinct('_id');
    query.employee = { $in: staffIds };
  }

  if (filters.fromDate || filters.toDate) {
    query.reportDate = {};
    if (filters.fromDate) {
      query.reportDate.$gte = parseDateOnly(filters.fromDate);
    }
    if (filters.toDate) {
      query.reportDate.$lte = endOfDay(parseDateOnly(filters.toDate));
    }
  }

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    WorkReport.find(query)
      .sort({ reportDate: -1, submittedAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('employee', 'fullName employeeId department designation role')
      .populate('reviewedBy', 'fullName'),
    WorkReport.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
};

export const reviewWorkReport = async (
  id: string,
  adminId: string,
  status: 'approved' | 'rejected',
  adminComment = '',
) => {
  const report = await WorkReport.findById(id);
  if (!report) {
    throw ApiError.notFound('Work report not found');
  }

  if (report.status !== 'submitted') {
    throw ApiError.badRequest('Only submitted reports can be reviewed');
  }

  report.status = status;
  report.adminComment = adminComment;
  report.reviewedBy = new Types.ObjectId(adminId);
  report.reviewedAt = new Date();
  await report.save();

  await createNotification({
    recipient: report.employee,
    title: `Work report ${status}`,
    message: adminComment
      ? `Your report "${report.title}" was ${status}. Comment: ${adminComment}`
      : `Your report "${report.title}" was ${status}.`,
    type: 'work_report',
    relatedId: report._id,
  });

  return report;
};

export const getWorkReportStats = async () => {
  const today = parseDateOnly(new Date());
  const dayEnd = endOfDay(today);

  const [submittedToday, awaitingApproval] = await Promise.all([
    WorkReport.countDocuments({
      status: { $in: ['submitted', 'approved', 'rejected'] },
      submittedAt: { $gte: today, $lte: dayEnd },
    }),
    WorkReport.countDocuments({ status: 'submitted' }),
  ]);

  return { submittedToday, awaitingApproval };
};
