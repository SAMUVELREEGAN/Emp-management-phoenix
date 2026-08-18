import { FilterQuery, Types } from 'mongoose';
import { Attendance, IAttendance } from '../models/Attendance';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  calculateBreakMinutes,
  calculateNetWorkingMinutes,
  calculateOvertimeMinutes,
  calculateWorkingMinutes,
  determineAttendanceStatus,
  endOfDay,
  formatLateDuration,
  isEarlyCheckout,
  isOnBreak,
  isWeeklyHoliday,
  parseDateOnly,
  startOfDay,
} from '../utils/dateHelpers';
import { LocationPayload } from '../types';
import { createNotification } from './notificationService';
import { findActiveAdmins, findActiveManagers } from '../utils/roleHelpers';
import { resolveLocationAddress } from '../utils/geocoding';
import { getOfficeHours } from './officeSettingsService';
import { startRouteSession, endRouteSession } from './routeService';
import {
  evaluateGeofence,
  formatDistanceMeters,
} from '../utils/geofence';

interface ListFilters {
  page: number;
  limit: number;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  attendanceStatus?: string;
  search?: string;
  staffRole?: 'employee' | 'hr';
}

const employeePopulateFields =
  'fullName employeeId department designation email role';

function enrichAttendanceRecord<
  T extends {
    checkInTime?: Date;
    checkOutTime?: Date;
    totalWorkingMinutes?: number;
    totalBreakMinutes?: number;
    breakSessions?: { startedAt: Date; endedAt?: Date }[];
    overtimeMinutes?: number;
    toObject?: () => T;
  },
>(attendance: T | null, officeEndTime?: string): T | null {
  if (!attendance) {
    return null;
  }

  const record =
    typeof attendance.toObject === 'function'
      ? (attendance.toObject() as T)
      : { ...attendance };

  const breakSessions = record.breakSessions ?? [];
  const now = new Date();
  const breakMinutes = calculateBreakMinutes(breakSessions, now);
  record.totalBreakMinutes = breakMinutes;

  if (record.checkInTime && !record.checkOutTime) {
    record.totalWorkingMinutes = calculateNetWorkingMinutes(
      new Date(record.checkInTime),
      now,
      breakMinutes,
    );
    record.overtimeMinutes = 0;
  } else if (record.checkInTime && record.checkOutTime) {
    const grossMinutes = calculateWorkingMinutes(
      new Date(record.checkInTime),
      new Date(record.checkOutTime),
    );
    const storedBreakMinutes =
      record.totalBreakMinutes != null && record.totalBreakMinutes >= 0
        ? record.totalBreakMinutes
        : breakMinutes;

    record.totalWorkingMinutes =
      record.totalWorkingMinutes && record.totalWorkingMinutes > 0
        ? record.totalWorkingMinutes
        : calculateNetWorkingMinutes(
            new Date(record.checkInTime),
            new Date(record.checkOutTime),
            storedBreakMinutes,
          );

    if (officeEndTime) {
      record.overtimeMinutes =
        record.overtimeMinutes != null && record.overtimeMinutes >= 0
          ? record.overtimeMinutes
          : calculateOvertimeMinutes(new Date(record.checkOutTime), officeEndTime);
    } else {
      record.overtimeMinutes = record.overtimeMinutes ?? 0;
    }

    if (!record.totalBreakMinutes) {
      record.totalBreakMinutes = storedBreakMinutes;
    }
  } else {
    record.totalWorkingMinutes = 0;
    record.totalBreakMinutes = 0;
    record.overtimeMinutes = 0;
  }

  return record;
}

function enrichAttendanceRecords<
  T extends {
    checkInTime?: Date;
    checkOutTime?: Date;
    totalWorkingMinutes?: number;
    totalBreakMinutes?: number;
    breakSessions?: { startedAt: Date; endedAt?: Date }[];
    overtimeMinutes?: number;
    toObject?: () => T;
  },
>(records: T[], officeEndTime?: string): T[] {
  return records.map(record => enrichAttendanceRecord(record, officeEndTime) as T);
}

async function enrichLocation(location: LocationPayload): Promise<LocationPayload> {
  return resolveLocationAddress(location);
}

async function assertWithinOfficeGeofence(
  location: LocationPayload,
  action: 'check-in' | 'check-out',
): Promise<void> {
  const officeSettings = await getOfficeHours();
  const geofence = evaluateGeofence(location, officeSettings);

  if (!geofence.enforced || geofence.within) {
    return;
  }

  const officeLabel = officeSettings.officeLocationName?.trim() || 'office';
  const distanceLabel = formatDistanceMeters(geofence.distanceMeters ?? 0);
  const placeLabel = location.address?.trim() || 'your current location';

  throw ApiError.badRequest(
    `You are outside the allowed ${officeLabel} area (${distanceLabel} away). ${action === 'check-in' ? 'Check-in' : 'Check-out'} is only allowed inside the geofence.\n\nYour current location:\n${placeLabel}`,
  );
}

async function notifyAttendanceEvent(
  actor: IUser,
  action: 'check-in' | 'check-out',
  attendanceId: Types.ObjectId,
  placeName: string,
  eventTime: Date,
  extra?: { lateMinutes?: number; earlyCheckoutRemark?: string; workFromHome?: boolean },
) {
  const timeLabel = eventTime.toLocaleTimeString();
  const roleLabel = actor.role === 'hr' ? 'HR' : 'Employee';
  const title =
    action === 'check-in' ? `${roleLabel} checked in` : `${roleLabel} checked out`;

  let message = `${actor.fullName} ${action === 'check-in' ? 'checked in' : 'checked out'} at ${timeLabel} from ${placeName}.`;

  if (action === 'check-in' && extra?.workFromHome) {
    message += ' Working from home.';
  }

  if (action === 'check-in' && extra?.lateMinutes && extra.lateMinutes > 0) {
    message += ` Late by ${formatLateDuration(extra.lateMinutes)}.`;
  }

  if (action === 'check-out' && extra?.earlyCheckoutRemark) {
    message += ` Early checkout reason: ${extra.earlyCheckoutRemark}`;
  }

  const actorId = actor._id.toString();
  const recipients =
    actor.role === 'hr'
      ? await findActiveAdmins()
      : await findActiveManagers();

  await Promise.all(
    recipients
      .filter((recipient) => recipient._id.toString() !== actorId)
      .map((recipient) =>
        createNotification({
          recipient: recipient._id,
          title,
          message,
          type: 'attendance',
          relatedId: attendanceId,
        }),
      ),
  );
}

export const checkIn = async (
  employeeId: string,
  location: LocationPayload,
  deviceTimestamp?: string,
  deviceTimezoneOffset?: number,
  workFromHome = false,
) => {
  const user = await User.findById(employeeId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const resolvedLocation = await enrichLocation(location);
  if (!workFromHome) {
    await assertWithinOfficeGeofence(resolvedLocation, 'check-in');
  }

  const now = deviceTimestamp ? new Date(deviceTimestamp) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw ApiError.badRequest('Invalid device timestamp');
  }

  const today = startOfDay(now);
  const existing = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (existing?.checkInTime) {
    throw ApiError.conflict('You have already checked in today');
  }

  const { status, lateMinutes } = await determineAttendanceStatus(
    now,
    deviceTimezoneOffset,
  );

  const attendance =
    existing ||
    (await Attendance.create({
      employee: employeeId,
      date: today,
      checkInTime: now,
      checkInLocation: resolvedLocation,
      attendanceStatus: status,
      lateMinutes,
      isWorkFromHome: workFromHome,
    }));

  if (existing) {
    existing.checkInTime = now;
    existing.checkInLocation = resolvedLocation;
    existing.attendanceStatus = status;
    existing.lateMinutes = lateMinutes;
    existing.lastHourlyReminderAt = undefined;
    existing.totalWorkingMinutes = 0;
    existing.totalBreakMinutes = 0;
    existing.breakSessions = [];
    existing.overtimeMinutes = 0;
    existing.checkOutTime = undefined;
    existing.checkOutLocation = undefined;
    existing.isEarlyCheckout = false;
    existing.earlyCheckoutRemark = '';
    existing.isWorkFromHome = workFromHome;
    await existing.save();
  }

  const result = existing || attendance;

  await notifyAttendanceEvent(
    user,
    'check-in',
    result._id,
    resolvedLocation.address || 'Unknown location',
    now,
    { lateMinutes, workFromHome },
  );

  await startRouteSession(employeeId, result._id, today, resolvedLocation);

  const officeHours = await getOfficeHours();

  return enrichAttendanceRecord(
    await Attendance.findById(result._id).populate('employee', employeePopulateFields),
    officeHours.officeEndTime,
  );
};

export const checkOut = async (
  employeeId: string,
  location: LocationPayload,
  deviceTimestamp?: string,
  earlyCheckoutRemark?: string,
  deviceTimezoneOffset?: number,
) => {
  const user = await User.findById(employeeId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const resolvedLocation = await enrichLocation(location);

  const now = deviceTimestamp ? new Date(deviceTimestamp) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw ApiError.badRequest('Invalid device timestamp');
  }

  const today = startOfDay(now);
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (!attendance?.checkInTime) {
    throw ApiError.badRequest('You must check in before checking out');
  }

  if (!attendance.isWorkFromHome) {
    await assertWithinOfficeGeofence(resolvedLocation, 'check-out');
  }

  if (attendance.checkOutTime) {
    throw ApiError.conflict('You have already checked out today');
  }

  if (now.getTime() < attendance.checkInTime.getTime()) {
    throw ApiError.badRequest('Check-out time cannot be before check-in time');
  }

  if (isOnBreak(attendance.breakSessions)) {
    const openBreak = attendance.breakSessions[attendance.breakSessions.length - 1];
    openBreak.endedAt = now;
  }

  const totalBreakMinutes = calculateBreakMinutes(attendance.breakSessions, now);

  const officeHours = await getOfficeHours();
  const earlyCheckout = isEarlyCheckout(
    now,
    officeHours.officeEndTime,
    deviceTimezoneOffset,
  );

  if (earlyCheckout) {
    const remark = earlyCheckoutRemark?.trim();
    if (!remark) {
      throw ApiError.badRequest(
        'Please provide a reason for checking out before office hours end',
      );
    }
    attendance.isEarlyCheckout = true;
    attendance.earlyCheckoutRemark = remark;
  } else {
    attendance.isEarlyCheckout = false;
    attendance.earlyCheckoutRemark = '';
  }

  attendance.checkOutTime = now;
  attendance.checkOutLocation = resolvedLocation;
  attendance.lastHourlyReminderAt = undefined;
  attendance.totalBreakMinutes = totalBreakMinutes;
  attendance.totalWorkingMinutes = calculateNetWorkingMinutes(
    attendance.checkInTime,
    now,
    totalBreakMinutes,
  );
  attendance.overtimeMinutes = calculateOvertimeMinutes(
    now,
    officeHours.officeEndTime,
    deviceTimezoneOffset,
  );

  await attendance.save();

  await notifyAttendanceEvent(
    user,
    'check-out',
    attendance._id,
    resolvedLocation.address || 'Unknown location',
    now,
    earlyCheckout
      ? { earlyCheckoutRemark: attendance.earlyCheckoutRemark }
      : undefined,
  );

  await endRouteSession(attendance._id.toString(), resolvedLocation);

  return enrichAttendanceRecord(
    await Attendance.findById(attendance._id).populate('employee', employeePopulateFields),
    officeHours.officeEndTime,
  );
};

async function getActiveAttendanceForToday(employeeId: string) {
  const today = startOfDay();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (!attendance?.checkInTime) {
    throw ApiError.badRequest('You must check in before managing breaks');
  }

  if (attendance.checkOutTime) {
    throw ApiError.badRequest('You have already checked out today');
  }

  return attendance;
}

export const startBreak = async (employeeId: string, deviceTimestamp?: string) => {
  const attendance = await getActiveAttendanceForToday(employeeId);

  if (isOnBreak(attendance.breakSessions)) {
    throw ApiError.conflict('You are already on a break');
  }

  const now = deviceTimestamp ? new Date(deviceTimestamp) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw ApiError.badRequest('Invalid device timestamp');
  }

  if (now.getTime() < attendance.checkInTime!.getTime()) {
    throw ApiError.badRequest('Break cannot start before check-in time');
  }

  attendance.breakSessions.push({ startedAt: now });
  await attendance.save();

  const officeHours = await getOfficeHours();

  return enrichAttendanceRecord(
    await Attendance.findById(attendance._id).populate('employee', employeePopulateFields),
    officeHours.officeEndTime,
  );
};

export const endBreak = async (employeeId: string, deviceTimestamp?: string) => {
  const attendance = await getActiveAttendanceForToday(employeeId);

  if (!isOnBreak(attendance.breakSessions)) {
    throw ApiError.badRequest('You are not currently on a break');
  }

  const now = deviceTimestamp ? new Date(deviceTimestamp) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw ApiError.badRequest('Invalid device timestamp');
  }

  const openBreak = attendance.breakSessions[attendance.breakSessions.length - 1];
  if (now.getTime() < openBreak.startedAt.getTime()) {
    throw ApiError.badRequest('Break end time cannot be before break start time');
  }

  openBreak.endedAt = now;
  attendance.totalBreakMinutes = calculateBreakMinutes(attendance.breakSessions, now);
  await attendance.save();

  const officeHours = await getOfficeHours();

  return enrichAttendanceRecord(
    await Attendance.findById(attendance._id).populate('employee', employeePopulateFields),
    officeHours.officeEndTime,
  );
};

export const getTodayAttendance = async (employeeId: string) => {
  const today = startOfDay();
  const [attendance, officeHours] = await Promise.all([
    Attendance.findOne({
      employee: employeeId,
      date: today,
    }).populate('employee', employeePopulateFields),
    getOfficeHours(),
  ]);

  return {
    attendance: enrichAttendanceRecord(attendance, officeHours.officeEndTime),
    officeHours,
  };
};

export const getMyAttendanceHistory = async (
  employeeId: string,
  filters: ListFilters,
) => {
  const officeHours = await getOfficeHours();
  const query: FilterQuery<IAttendance> = {
    employee: employeeId,
  };

  if (filters.fromDate || filters.toDate) {
    query.date = {};
    if (filters.fromDate) {
      query.date.$gte = parseDateOnly(filters.fromDate);
    }
    if (filters.toDate) {
      query.date.$lte = endOfDay(parseDateOnly(filters.toDate));
    }
  }

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('employee', employeePopulateFields),
    Attendance.countDocuments(query),
  ]);

  return {
    items: enrichAttendanceRecords(items, officeHours.officeEndTime),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
};

export const listAttendance = async (filters: ListFilters) => {
  const officeHours = await getOfficeHours();
  const query: FilterQuery<IAttendance> = {};

  if (filters.employeeId) {
    query.employee = new Types.ObjectId(filters.employeeId);
  } else if (filters.staffRole) {
    const staffIds = await User.find({ role: filters.staffRole }).distinct('_id');
    query.employee = { $in: staffIds };
  }

  if (filters.attendanceStatus) {
    query.attendanceStatus = filters.attendanceStatus;
  }

  if (filters.fromDate || filters.toDate) {
    query.date = {};
    if (filters.fromDate) {
      query.date.$gte = parseDateOnly(filters.fromDate);
    }
    if (filters.toDate) {
      query.date.$lte = endOfDay(parseDateOnly(filters.toDate));
    }
  }

  const skip = (filters.page - 1) * filters.limit;

  let items = await Attendance.find(query)
    .sort({ date: -1, checkInTime: -1 })
    .skip(skip)
    .limit(filters.limit)
    .populate('employee', employeePopulateFields);

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    items = items.filter((item) => {
      const emp = item.employee as unknown as {
        fullName?: string;
        employeeId?: string;
      };
      return (
        regex.test(emp?.fullName || '') || regex.test(emp?.employeeId || '')
      );
    });
  }

  const total = await Attendance.countDocuments(query);

  return {
    items: enrichAttendanceRecords(items, officeHours.officeEndTime),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
};

export const getAttendanceById = async (id: string) => {
  const officeHours = await getOfficeHours();
  const attendance = await Attendance.findById(id).populate(
    'employee',
    `${employeePopulateFields} phone`,
  );
  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }
  return enrichAttendanceRecord(attendance, officeHours.officeEndTime);
};

export type AttendanceBreakdownCategory =
  | 'present'
  | 'absent'
  | 'late'
  | 'checked_out';

function getEmployeeIdFromRecord(record: {
  employee?: { _id?: { toString(): string } } | string;
}): string {
  const employee = record.employee;
  if (typeof employee === 'object' && employee !== null && '_id' in employee) {
    return String((employee as { _id: { toString(): string } })._id);
  }
  return String(employee);
}

export const getAttendanceBreakdown = async (
  dateInput: string,
  staffRole: 'employee' | 'hr',
  category: AttendanceBreakdownCategory,
) => {
  const date = parseDateOnly(dateInput);
  const dayEnd = endOfDay(date);

  const activeUsers = await User.find({
    role: staffRole,
    status: 'active',
  }).select('fullName employeeId department designation email role');

  const userIds = activeUsers.map((user) => user._id);

  const officeHours = await getOfficeHours();

  const records = await Attendance.find({
    date: { $gte: date, $lte: dayEnd },
    employee: { $in: userIds },
  }).populate('employee', employeePopulateFields);

  const enriched = enrichAttendanceRecords(records, officeHours.officeEndTime);

  const checkedInRecords = enriched.filter(
    (record) =>
      !!record.checkInTime &&
      ['present', 'late', 'half_day'].includes(record.attendanceStatus),
  );

  const checkedInEmployeeIds = new Set(
    checkedInRecords.map((record) => getEmployeeIdFromRecord(record)),
  );

  switch (category) {
    case 'present':
      return checkedInRecords;
    case 'late':
      return enriched.filter((record) => record.attendanceStatus === 'late');
    case 'checked_out':
      return enriched.filter((record) => !!record.checkOutTime);
    case 'absent':
      if (isWeeklyHoliday(date)) {
        return [];
      }
      return activeUsers
        .filter((user) => !checkedInEmployeeIds.has(user._id.toString()))
        .map((user) => ({
          _id: `absent-${user._id.toString()}`,
          employee: user,
          date: date.toISOString(),
          attendanceStatus: 'absent' as const,
          totalWorkingMinutes: 0,
          lateMinutes: 0,
          isEarlyCheckout: false,
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
        }));
    default:
      return [];
  }
};

const buildRoleSummary = (
  activeCount: number,
  records: IAttendance[],
  role: 'employee' | 'hr',
  date?: Date,
) => {
  const roleRecords = records.filter((record) => {
    const emp = record.employee as unknown as { role?: string };
    return emp?.role === role;
  });

  const present = roleRecords.filter((record) =>
    ['present', 'late', 'half_day'].includes(record.attendanceStatus),
  ).length;
  const late = roleRecords.filter(
    (record) => record.attendanceStatus === 'late',
  ).length;
  const checkedOut = roleRecords.filter((record) => !!record.checkOutTime).length;
  const isHoliday = date ? isWeeklyHoliday(date) : false;

  return {
    active: activeCount,
    present,
    absent: isHoliday ? 0 : Math.max(activeCount - present, 0),
    late,
    checkedOut,
  };
};

export const getAttendanceSummary = async (dateInput?: string) => {
  const date = dateInput ? parseDateOnly(dateInput) : startOfDay();
  const dayEnd = endOfDay(date);

  const [
    totalEmployees,
    activeEmployees,
    totalHr,
    activeHr,
    todayRecords,
  ] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    User.countDocuments({ role: 'employee', status: 'active' }),
    User.countDocuments({ role: 'hr' }),
    User.countDocuments({ role: 'hr', status: 'active' }),
    Attendance.find({
      date: { $gte: date, $lte: dayEnd },
    }).populate('employee', 'role'),
  ]);

  const presentToday = todayRecords.filter((record) =>
    ['present', 'late', 'half_day'].includes(record.attendanceStatus),
  ).length;
  const lateToday = todayRecords.filter(
    (record) => record.attendanceStatus === 'late',
  ).length;
  const checkedOutToday = todayRecords.filter(
    (record) => !!record.checkOutTime,
  ).length;
  const activeStaff = activeEmployees + activeHr;
  const isHoliday = isWeeklyHoliday(date);
  const absentToday = isHoliday
    ? 0
    : Math.max(activeStaff - presentToday, 0);

  const employees = buildRoleSummary(activeEmployees, todayRecords, 'employee', date);
  const hr = buildRoleSummary(activeHr, todayRecords, 'hr', date);

  return {
    totalEmployees,
    activeEmployees,
    totalHr,
    activeHr,
    totalStaff: totalEmployees + totalHr,
    activeStaff,
    presentToday,
    absentToday,
    lateToday,
    checkedOutToday,
    employees,
    hr,
    date,
  };
};
