import { FilterQuery, Types } from 'mongoose';
import { Shift, IShift } from '../models/Shift';
import { ShiftAssignment, IShiftAssignment } from '../models/ShiftAssignment';
import {
  ShiftChangeRequest,
  IShiftChangeRequest,
} from '../models/ShiftChangeRequest';
import { ShiftReport, IShiftReport, ShiftReportSnapshot } from '../models/ShiftReport';
import { Attendance } from '../models/Attendance';
import { LeaveRequest } from '../models/LeaveRequest';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  endOfDay,
  evaluateCheckIn,
  parseDateOnly,
  startOfDay,
} from '../utils/dateHelpers';
import { getOfficeHours } from './officeSettingsService';
import { createNotification } from './notificationService';
import { findActiveAdmins, findActiveManagers } from '../utils/roleHelpers';

const userPopulateFields = 'fullName employeeId department designation role';
const shiftPopulateFields = 'name code startTime endTime workingDays graceMinutes breakDurationMinutes color';

interface PaginationFilters {
  page: number;
  limit: number;
  status?: string;
  employeeId?: string;
  shiftId?: string;
  search?: string;
}

export interface EmployeeShiftHours {
  shiftId?: string;
  shiftName?: string;
  shiftCode?: string;
  officeStartTime: string;
  officeEndTime: string;
  graceMinutes: number;
  breakDurationMinutes: number;
  workingDays: number[];
  isShiftAssigned: boolean;
}

export const getEmployeeShiftForDate = async (
  employeeId: string,
  date: Date = new Date(),
): Promise<EmployeeShiftHours> => {
  const assignment = await ShiftAssignment.findOne({
    employee: employeeId,
    isActive: true,
    effectiveFrom: { $lte: endOfDay(date) },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: startOfDay(date) } }],
  })
    .sort({ effectiveFrom: -1 })
    .populate('shift');

  if (assignment?.shift && typeof assignment.shift === 'object') {
    const shift = assignment.shift as unknown as IShift;
    return {
      shiftId: shift._id.toString(),
      shiftName: shift.name,
      shiftCode: shift.code,
      officeStartTime: shift.startTime,
      officeEndTime: shift.endTime,
      graceMinutes: shift.graceMinutes,
      breakDurationMinutes: shift.breakDurationMinutes,
      workingDays: shift.workingDays,
      isShiftAssigned: true,
    };
  }

  const officeHours = await getOfficeHours();
  return {
    officeStartTime: officeHours.officeStartTime,
    officeEndTime: officeHours.officeEndTime,
    graceMinutes: 0,
    breakDurationMinutes: 60,
    workingDays: [1, 2, 3, 4, 5, 6],
    isShiftAssigned: false,
  };
};

export const determineAttendanceStatusForEmployee = async (
  employeeId: string,
  checkInTime: Date,
  timezoneOffsetMinutes?: number,
): Promise<{ status: 'present' | 'late'; lateMinutes: number; shiftId?: string }> => {
  const shiftHours = await getEmployeeShiftForDate(employeeId, checkInTime);
  const dayOfWeek = checkInTime.getDay();

  if (shiftHours.isShiftAssigned && !shiftHours.workingDays.includes(dayOfWeek)) {
    return { status: 'present', lateMinutes: 0, shiftId: shiftHours.shiftId };
  }

  const graceStartMinutes =
    parseTimeToMinutes(shiftHours.officeStartTime) + (shiftHours.graceMinutes || 0);
  const evaluation = evaluateCheckIn(checkInTime, shiftHours.officeStartTime, timezoneOffsetMinutes);

  if (evaluation.lateMinutes <= shiftHours.graceMinutes) {
    return {
      status: 'present',
      lateMinutes: 0,
      shiftId: shiftHours.shiftId,
    };
  }

  const checkInMinutes =
    timezoneOffsetMinutes != null
      ? getDeviceLocalMinutes(checkInTime, timezoneOffsetMinutes)
      : checkInTime.getHours() * 60 + checkInTime.getMinutes();

  if (checkInMinutes > graceStartMinutes) {
    return {
      status: 'late',
      lateMinutes: checkInMinutes - parseTimeToMinutes(shiftHours.officeStartTime),
      shiftId: shiftHours.shiftId,
    };
  }

  return { status: evaluation.status, lateMinutes: evaluation.lateMinutes, shiftId: shiftHours.shiftId };
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDeviceLocalMinutes(date: Date, timezoneOffsetMinutes: number): number {
  const localMs = date.getTime() - timezoneOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

const validateShiftTimes = (startTime: string, endTime: string) => {
  if (parseTimeToMinutes(startTime) >= parseTimeToMinutes(endTime)) {
    throw ApiError.badRequest('Shift end time must be after start time');
  }
};

export const createShift = async (
  createdBy: string,
  data: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    workingDays: number[];
    graceMinutes?: number;
    breakDurationMinutes?: number;
    description?: string;
    color?: string;
  },
) => {
  validateShiftTimes(data.startTime, data.endTime);

  const existing = await Shift.findOne({ code: data.code.trim().toUpperCase() });
  if (existing) {
    throw ApiError.conflict('Shift code already exists');
  }

  const shift = await Shift.create({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    startTime: data.startTime,
    endTime: data.endTime,
    workingDays: data.workingDays,
    graceMinutes: data.graceMinutes ?? 10,
    breakDurationMinutes: data.breakDurationMinutes ?? 60,
    description: data.description?.trim() || '',
    color: data.color || '#2563EB',
    createdBy,
    isActive: true,
  });

  return Shift.findById(shift._id).populate('createdBy', 'fullName');
};

export const listShifts = async (filters: PaginationFilters & { activeOnly?: boolean }) => {
  const query: FilterQuery<IShift> = {};

  if (filters.activeOnly) {
    query.isActive = true;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: regex }, { code: regex }];
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    Shift.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('createdBy', 'fullName'),
    Shift.countDocuments(query),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
};

export const getShiftById = async (shiftId: string) => {
  const shift = await Shift.findById(shiftId).populate('createdBy', 'fullName');
  if (!shift) {
    throw ApiError.notFound('Shift not found');
  }
  return shift;
};

export const updateShift = async (
  shiftId: string,
  data: Partial<{
    name: string;
    startTime: string;
    endTime: string;
    workingDays: number[];
    graceMinutes: number;
    breakDurationMinutes: number;
    description: string;
    color: string;
    isActive: boolean;
  }>,
) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw ApiError.notFound('Shift not found');
  }

  const startTime = data.startTime ?? shift.startTime;
  const endTime = data.endTime ?? shift.endTime;
  validateShiftTimes(startTime, endTime);

  if (data.name) shift.name = data.name.trim();
  if (data.startTime) shift.startTime = data.startTime;
  if (data.endTime) shift.endTime = data.endTime;
  if (data.workingDays) shift.workingDays = data.workingDays;
  if (data.graceMinutes != null) shift.graceMinutes = data.graceMinutes;
  if (data.breakDurationMinutes != null) shift.breakDurationMinutes = data.breakDurationMinutes;
  if (data.description != null) shift.description = data.description.trim();
  if (data.color) shift.color = data.color;
  if (data.isActive != null) shift.isActive = data.isActive;

  await shift.save();
  return Shift.findById(shift._id).populate('createdBy', 'fullName');
};

export const assignShift = async (
  assignedBy: string,
  data: {
    shiftId: string;
    employeeIds: string[];
    effectiveFrom: string;
    effectiveTo?: string;
    notes?: string;
  },
) => {
  const shift = await Shift.findById(data.shiftId);
  if (!shift || !shift.isActive) {
    throw ApiError.notFound('Active shift not found');
  }

  const effectiveFrom = parseDateOnly(data.effectiveFrom);
  const effectiveTo = data.effectiveTo ? parseDateOnly(data.effectiveTo) : undefined;

  if (effectiveTo && effectiveTo < effectiveFrom) {
    throw ApiError.badRequest('Effective end date must be on or after start date');
  }

  const employees = await User.find({
    _id: { $in: data.employeeIds },
    role: 'employee',
    status: 'active',
  });

  if (employees.length !== data.employeeIds.length) {
    throw ApiError.badRequest('One or more employees are invalid or inactive');
  }

  const assignments = [];

  for (const employee of employees) {
    await ShiftAssignment.updateMany(
      {
        employee: employee._id,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          effectiveTo: effectiveFrom,
        },
      },
    );

    const assignment = await ShiftAssignment.create({
      employee: employee._id,
      shift: shift._id,
      effectiveFrom,
      effectiveTo,
      assignedBy,
      notes: data.notes?.trim() || '',
      isActive: true,
    });

    await createNotification({
      recipient: employee._id,
      title: 'Shift assigned',
      message: `You have been assigned to ${shift.name} (${shift.startTime} - ${shift.endTime}).`,
      type: 'shift',
      relatedId: assignment._id,
    });

    assignments.push(assignment);
  }

  const populated = await ShiftAssignment.find({
    _id: { $in: assignments.map(item => item._id) },
  })
    .populate('employee', userPopulateFields)
    .populate('shift', shiftPopulateFields)
    .populate('assignedBy', 'fullName');

  return populated;
};

export const listAssignments = async (filters: PaginationFilters) => {
  const query: FilterQuery<IShiftAssignment> = { isActive: true };

  if (filters.employeeId) {
    query.employee = new Types.ObjectId(filters.employeeId);
  }

  if (filters.shiftId) {
    query.shift = new Types.ObjectId(filters.shiftId);
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    ShiftAssignment.find(query)
      .sort({ effectiveFrom: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('employee', userPopulateFields)
      .populate('shift', shiftPopulateFields)
      .populate('assignedBy', 'fullName'),
    ShiftAssignment.countDocuments(query),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
};

export const getMyShift = async (employeeId: string) => {
  const assignment = await ShiftAssignment.findOne({
    employee: employeeId,
    isActive: true,
  })
    .sort({ effectiveFrom: -1 })
    .populate('shift')
    .populate('assignedBy', 'fullName');

  const shiftHours = await getEmployeeShiftForDate(employeeId);
  return { assignment, shiftHours };
};

export const createChangeRequest = async (
  employeeId: string,
  data: {
    requestedShiftId: string;
    effectiveDate: string;
    reason: string;
  },
) => {
  const current = await getEmployeeShiftForDate(employeeId);
  if (!current.shiftId) {
    throw ApiError.badRequest('You do not have an assigned shift to change');
  }

  if (current.shiftId === data.requestedShiftId) {
    throw ApiError.badRequest('Requested shift is the same as your current shift');
  }

  const requestedShift = await Shift.findById(data.requestedShiftId);
  if (!requestedShift || !requestedShift.isActive) {
    throw ApiError.notFound('Requested shift not found');
  }

  const effectiveDate = parseDateOnly(data.effectiveDate);
  if (effectiveDate < startOfDay()) {
    throw ApiError.badRequest('Effective date cannot be in the past');
  }

  const pending = await ShiftChangeRequest.findOne({
    employee: employeeId,
    status: 'pending',
  });

  if (pending) {
    throw ApiError.conflict('You already have a pending shift change request');
  }

  const request = await ShiftChangeRequest.create({
    employee: employeeId,
    currentShift: current.shiftId,
    requestedShift: data.requestedShiftId,
    effectiveDate,
    reason: data.reason.trim(),
    status: 'pending',
  });

  const managers = await findActiveManagers();
  await Promise.all(
    managers.map(manager =>
      createNotification({
        recipient: manager._id,
        title: 'Shift change request',
        message: 'An employee submitted a shift change request for review.',
        type: 'shift',
        relatedId: request._id,
      }),
    ),
  );

  return ShiftChangeRequest.findById(request._id)
    .populate('employee', userPopulateFields)
    .populate('currentShift', shiftPopulateFields)
    .populate('requestedShift', shiftPopulateFields);
};

export const listChangeRequests = async (filters: PaginationFilters) => {
  const query: FilterQuery<IShiftChangeRequest> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.employeeId) {
    query.employee = new Types.ObjectId(filters.employeeId);
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    ShiftChangeRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('employee', userPopulateFields)
      .populate('currentShift', shiftPopulateFields)
      .populate('requestedShift', shiftPopulateFields)
      .populate('reviewedBy', 'fullName'),
    ShiftChangeRequest.countDocuments(query),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
};

export const getMyChangeRequests = async (employeeId: string, filters: PaginationFilters) => {
  return listChangeRequests({ ...filters, employeeId });
};

export const reviewChangeRequest = async (
  reviewerId: string,
  requestId: string,
  status: 'approved' | 'rejected',
  adminComment?: string,
) => {
  const request = await ShiftChangeRequest.findById(requestId);
  if (!request) {
    throw ApiError.notFound('Shift change request not found');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest('This request has already been reviewed');
  }

  request.status = status;
  request.reviewedBy = new Types.ObjectId(reviewerId);
  request.reviewedAt = new Date();
  request.adminComment = adminComment?.trim() || '';

  if (status === 'approved') {
    await ShiftAssignment.updateMany(
      { employee: request.employee, isActive: true },
      { $set: { isActive: false, effectiveTo: request.effectiveDate } },
    );

    await ShiftAssignment.create({
      employee: request.employee,
      shift: request.requestedShift,
      effectiveFrom: request.effectiveDate,
      assignedBy: reviewerId,
      notes: `Approved shift change request`,
      isActive: true,
    });
  }

  await request.save();

  await createNotification({
    recipient: request.employee,
    title: status === 'approved' ? 'Shift change approved' : 'Shift change rejected',
    message:
      status === 'approved'
        ? 'Your shift change request has been approved.'
        : `Your shift change request was rejected.${adminComment ? ` Comment: ${adminComment}` : ''}`,
    type: 'shift',
    relatedId: request._id,
  });

  return ShiftChangeRequest.findById(request._id)
    .populate('employee', userPopulateFields)
    .populate('currentShift', shiftPopulateFields)
    .populate('requestedShift', shiftPopulateFields)
    .populate('reviewedBy', 'fullName');
};

export const getChangeRequestById = async (
  requestId: string,
  viewer?: { id: string; role: string },
) => {
  const request = await ShiftChangeRequest.findById(requestId)
    .populate('employee', userPopulateFields)
    .populate('currentShift', shiftPopulateFields)
    .populate('requestedShift', shiftPopulateFields)
    .populate('reviewedBy', 'fullName');

  if (!request) {
    throw ApiError.notFound('Shift change request not found');
  }

  if (viewer?.role === 'employee') {
    const employeeRef = request.employee as Types.ObjectId | { _id: Types.ObjectId };
    const employeeId =
      typeof employeeRef === 'object' && employeeRef !== null && '_id' in employeeRef
        ? employeeRef._id.toString()
        : String(employeeRef);
    if (employeeId !== viewer.id) {
      throw ApiError.forbidden('You can only view your own requests');
    }
  }

  return request;
};

export const cancelChangeRequest = async (employeeId: string, requestId: string) => {
  const request = await ShiftChangeRequest.findById(requestId);
  if (!request) {
    throw ApiError.notFound('Shift change request not found');
  }

  if (request.employee.toString() !== employeeId) {
    throw ApiError.forbidden('You can only cancel your own requests');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest('Only pending requests can be cancelled');
  }

  request.status = 'cancelled';
  await request.save();

  return ShiftChangeRequest.findById(request._id)
    .populate('employee', userPopulateFields)
    .populate('currentShift', shiftPopulateFields)
    .populate('requestedShift', shiftPopulateFields);
};

const buildShiftAttendanceForDate = async (shiftId: string, date: Date) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw ApiError.notFound('Shift not found');
  }

  const assignments = await ShiftAssignment.find({
    shift: shiftId,
    isActive: true,
    effectiveFrom: { $lte: endOfDay(date) },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: startOfDay(date) } }],
  }).populate('employee', userPopulateFields);

  const employeeIds = assignments.map(item => item.employee._id ?? item.employee);

  const [attendanceRecords, leaveRecords] = await Promise.all([
    Attendance.find({
      employee: { $in: employeeIds },
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    }),
    LeaveRequest.find({
      employee: { $in: employeeIds },
      status: 'approved',
      fromDate: { $lte: endOfDay(date) },
      toDate: { $gte: startOfDay(date) },
    }),
  ]);

  const attendanceByEmployee = new Map(
    attendanceRecords.map(record => [record.employee.toString(), record]),
  );
  const onLeaveEmployees = new Set(leaveRecords.map(record => record.employee.toString()));

  let present = 0;
  let late = 0;
  let absent = 0;
  let onLeave = 0;
  let notCheckedIn = 0;

  const employees = assignments.map(assignment => {
    const employeeDoc = assignment.employee as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      employeeId: string;
    };
    const employee = employeeDoc;
    const employeeId = employee._id.toString();
    const attendance = attendanceByEmployee.get(employeeId);

    let status: 'present' | 'late' | 'absent' | 'on_leave' | 'not_checked_in' = 'not_checked_in';

    if (onLeaveEmployees.has(employeeId)) {
      status = 'on_leave';
      onLeave += 1;
    } else if (!attendance?.checkInTime) {
      status = 'not_checked_in';
      notCheckedIn += 1;
    } else if (attendance.attendanceStatus === 'late') {
      status = 'late';
      late += 1;
    } else {
      status = 'present';
      present += 1;
    }

    return {
      employee,
      attendance,
      status,
    };
  });

  return {
    shift,
    date,
    summary: {
      assignedCount: assignments.length,
      present,
      late,
      absent,
      onLeave,
      notCheckedIn,
    },
    employees,
  };
};

export const getShiftAttendance = async (shiftId: string, dateInput: string) => {
  const date = parseDateOnly(dateInput);
  return buildShiftAttendanceForDate(shiftId, date);
};

export const getShiftStats = async () => {
  const [totalShifts, activeAssignments, pendingChangeRequests, activeEmployees] = await Promise.all([
    Shift.countDocuments({ isActive: true }),
    ShiftAssignment.countDocuments({ isActive: true }),
    ShiftChangeRequest.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'employee', status: 'active' }),
  ]);

  const assignedEmployeeIds = await ShiftAssignment.distinct('employee', { isActive: true });

  return {
    totalShifts,
    activeAssignments,
    pendingChangeRequests,
    employeesWithoutShift: Math.max(activeEmployees - assignedEmployeeIds.length, 0),
  };
};

const buildReportSnapshot = async (date: Date): Promise<ShiftReportSnapshot> => {
  const stats = await getShiftStats();
  const shifts = await Shift.find({ isActive: true }).sort({ name: 1 });

  const shiftAttendance = await Promise.all(
    shifts.map(async shift => {
      const result = await buildShiftAttendanceForDate(shift._id.toString(), date);
      return {
        shiftId: shift._id.toString(),
        shiftName: shift.name,
        shiftCode: shift.code,
        assignedCount: result.summary.assignedCount,
        present: result.summary.present,
        late: result.summary.late,
        absent: result.summary.absent,
        onLeave: result.summary.onLeave,
        notCheckedIn: result.summary.notCheckedIn,
      };
    }),
  );

  return {
    totalShifts: stats.totalShifts,
    activeAssignments: stats.activeAssignments,
    employeesWithoutShift: stats.employeesWithoutShift,
    pendingChangeRequests: stats.pendingChangeRequests,
    shiftAttendance,
  };
};

export const submitShiftReport = async (
  submittedBy: string,
  data: {
    periodFrom: string;
    periodTo: string;
    title: string;
    notes?: string;
  },
) => {
  const periodFrom = parseDateOnly(data.periodFrom);
  const periodTo = parseDateOnly(data.periodTo);

  if (periodFrom > periodTo) {
    throw ApiError.badRequest('Period start must be on or before period end');
  }

  const snapshot = await buildReportSnapshot(periodTo);

  const report = await ShiftReport.create({
    submittedBy,
    periodFrom,
    periodTo,
    title: data.title.trim(),
    notes: data.notes?.trim() || '',
    snapshot,
    status: 'submitted',
  });

  const admins = await findActiveAdmins();
  await Promise.all(
    admins.map(admin =>
      createNotification({
        recipient: admin._id,
        title: 'Shift report submitted',
        message: `HR submitted shift report: ${data.title.trim()}`,
        type: 'shift',
        relatedId: report._id,
      }),
    ),
  );

  return ShiftReport.findById(report._id)
    .populate('submittedBy', userPopulateFields)
    .populate('acknowledgedBy', 'fullName');
};

export const listShiftReports = async (filters: PaginationFilters & { submittedBy?: string }) => {
  const query: FilterQuery<IShiftReport> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.submittedBy) {
    query.submittedBy = new Types.ObjectId(filters.submittedBy);
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    ShiftReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('submittedBy', userPopulateFields)
      .populate('acknowledgedBy', 'fullName'),
    ShiftReport.countDocuments(query),
  ]);

  return { items, total, page: filters.page, limit: filters.limit };
};

export const getShiftReportById = async (reportId: string) => {
  const report = await ShiftReport.findById(reportId)
    .populate('submittedBy', userPopulateFields)
    .populate('acknowledgedBy', 'fullName');

  if (!report) {
    throw ApiError.notFound('Shift report not found');
  }

  return report;
};

export const acknowledgeShiftReport = async (adminId: string, reportId: string) => {
  const report = await ShiftReport.findById(reportId);
  if (!report) {
    throw ApiError.notFound('Shift report not found');
  }

  if (report.status === 'acknowledged') {
    return getShiftReportById(reportId);
  }

  report.status = 'acknowledged';
  report.acknowledgedBy = new Types.ObjectId(adminId);
  report.acknowledgedAt = new Date();
  await report.save();

  await createNotification({
    recipient: report.submittedBy,
    title: 'Shift report acknowledged',
    message: `Admin acknowledged your shift report: ${report.title}`,
    type: 'shift',
    relatedId: report._id,
  });

  return getShiftReportById(reportId);
};
