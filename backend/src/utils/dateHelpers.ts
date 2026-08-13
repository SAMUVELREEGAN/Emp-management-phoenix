import { env } from '../config/env';
import { getOfficeHours } from '../services/officeSettingsService';

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getMinutesFromDate = (date: Date): number => {
  return date.getHours() * 60 + date.getMinutes();
};

/** Wall-clock minutes using the device timezone (JS getTimezoneOffset convention). */
export const getDeviceLocalMinutes = (
  date: Date,
  timezoneOffsetMinutes: number,
): number => {
  const localMs = date.getTime() - timezoneOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
};

export const calculateWorkingMinutes = (
  checkIn: Date,
  checkOut: Date,
): number => {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60)));
};

export interface BreakSessionLike {
  startedAt: Date | string;
  endedAt?: Date | string;
}

export const calculateBreakMinutes = (
  sessions: BreakSessionLike[] = [],
  referenceTime: Date = new Date(),
): number => {
  return sessions.reduce((total, session) => {
    const start = new Date(session.startedAt);
    const end = session.endedAt ? new Date(session.endedAt) : referenceTime;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return total;
    }

    return total + Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  }, 0);
};

export const isOnBreak = (sessions: BreakSessionLike[] = []): boolean => {
  if (!sessions.length) {
    return false;
  }

  const lastSession = sessions[sessions.length - 1];
  return !lastSession.endedAt;
};

export const calculateNetWorkingMinutes = (
  checkIn: Date,
  checkOut: Date,
  breakMinutes: number,
): number => {
  return Math.max(0, calculateWorkingMinutes(checkIn, checkOut) - breakMinutes);
};

export const formatWorkingHours = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const formatLateDuration = (lateMinutes: number): string => {
  if (lateMinutes <= 0) {
    return '';
  }
  const hours = Math.floor(lateMinutes / 60);
  const minutes = lateMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
};

export const evaluateCheckIn = (
  checkInTime: Date,
  officeStartTime: string,
  timezoneOffsetMinutes?: number,
): { status: 'present' | 'late'; lateMinutes: number } => {
  const officeStart = parseTimeToMinutes(officeStartTime);
  const checkInMinutes =
    timezoneOffsetMinutes != null
      ? getDeviceLocalMinutes(checkInTime, timezoneOffsetMinutes)
      : getMinutesFromDate(checkInTime);

  if (checkInMinutes > officeStart) {
    return {
      status: 'late',
      lateMinutes: checkInMinutes - officeStart,
    };
  }

  return { status: 'present', lateMinutes: 0 };
};

export const isEarlyCheckout = (
  checkOutTime: Date,
  officeEndTime: string,
  timezoneOffsetMinutes?: number,
): boolean => {
  const checkoutMinutes =
    timezoneOffsetMinutes != null
      ? getDeviceLocalMinutes(checkOutTime, timezoneOffsetMinutes)
      : getMinutesFromDate(checkOutTime);

  return checkoutMinutes < parseTimeToMinutes(officeEndTime);
};

/** Minutes worked after office end time on the same day (0 if checkout is on time or early). */
export const calculateOvertimeMinutes = (
  checkOutTime: Date,
  officeEndTime: string,
  timezoneOffsetMinutes?: number,
): number => {
  const checkoutMinutes =
    timezoneOffsetMinutes != null
      ? getDeviceLocalMinutes(checkOutTime, timezoneOffsetMinutes)
      : getMinutesFromDate(checkOutTime);
  const officeEndMinutes = parseTimeToMinutes(officeEndTime);

  if (checkoutMinutes <= officeEndMinutes) {
    return 0;
  }

  return checkoutMinutes - officeEndMinutes;
};

export const determineAttendanceStatus = async (
  checkInTime: Date,
  timezoneOffsetMinutes?: number,
): Promise<{ status: 'present' | 'late'; lateMinutes: number }> => {
  try {
    const officeHours = await getOfficeHours();
    return evaluateCheckIn(
      checkInTime,
      officeHours.officeStartTime,
      timezoneOffsetMinutes,
    );
  } catch {
    return evaluateCheckIn(
      checkInTime,
      env.OFFICE_START_TIME,
      timezoneOffsetMinutes,
    );
  }
};

export const startOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const parseDateOnly = (value: string | Date): Date => {
  if (value instanceof Date) {
    return startOfDay(value);
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/** Sundays are treated as weekly holidays across attendance reports. */
export const isWeeklyHoliday = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}/.test(value)
        ? parseDateOnly(value.slice(0, 10))
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getDay() === 0;
};

export const WEEKLY_HOLIDAY_LABEL = '-';

export const toDateKey = (value: string | Date): string => {
  const date = value instanceof Date ? value : parseDateOnly(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const eachDayInRange = (from: Date, to: Date): Date[] => {
  const days: Date[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

export const formatShortDateLabel = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const calculateLeaveDuration = (
  leaveType: 'full_day' | 'half_day',
  fromDateInput: string | Date,
  toDateInput: string | Date,
  halfDayHours?: number,
): { totalDays: number; label: string } => {
  if (leaveType === 'half_day') {
    const hours = halfDayHours && halfDayHours > 0 ? halfDayHours : 4;
    return {
      totalDays: 0.5,
      label: `${hours} hour${hours === 1 ? '' : 's'} (Half Day)`,
    };
  }

  const from = parseDateOnly(fromDateInput);
  const to = parseDateOnly(toDateInput);
  const diffMs = to.getTime() - from.getTime();
  const totalDays = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);

  return {
    totalDays,
    label: `${totalDays} day${totalDays === 1 ? '' : 's'}`,
  };
};
