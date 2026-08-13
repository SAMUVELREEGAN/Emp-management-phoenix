import type { Attendance, BreakSession } from '../types';
import { formatLateDuration, formatWorkingHours, getMinutesFromDate, parseTimeToMinutes } from './dates';

type AttendanceTiming = Pick<
  Attendance,
  'checkInTime' | 'checkOutTime' | 'totalWorkingMinutes' | 'totalBreakMinutes' | 'breakSessions'
>;

export function calculateLateMinutes(
  checkInTime: string | Date,
  officeStartTime: string,
): number {
  const checkIn = new Date(checkInTime);
  if (Number.isNaN(checkIn.getTime())) {
    return 0;
  }

  const checkInMinutes = getMinutesFromDate(checkIn);
  const officeStart = parseTimeToMinutes(officeStartTime);
  return Math.max(0, checkInMinutes - officeStart);
}

export function getEffectiveLateMinutes(
  attendance: Pick<Attendance, 'checkInTime' | 'lateMinutes' | 'attendanceStatus'>,
  officeStartTime?: string,
): number {
  if (officeStartTime && attendance.checkInTime) {
    return calculateLateMinutes(attendance.checkInTime, officeStartTime);
  }

  return attendance.lateMinutes ?? 0;
}

export function isAttendanceSessionActive(attendance?: AttendanceTiming | null): boolean {
  return !!attendance?.checkInTime && !attendance?.checkOutTime;
}

export function calculateElapsedMinutes(
  checkInTime: string | Date,
  endTime: string | Date = new Date(),
): number {
  const checkIn = new Date(checkInTime);
  const end = new Date(endTime);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = end.getTime() - checkIn.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

export function calculateBreakMinutes(
  sessions: BreakSession[] = [],
  referenceTime: Date = new Date(),
): number {
  return sessions.reduce((total, session) => {
    const start = new Date(session.startedAt);
    const end = session.endedAt ? new Date(session.endedAt) : referenceTime;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return total;
    }

    return total + Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  }, 0);
}

export function isOnBreak(attendance?: AttendanceTiming | null): boolean {
  const sessions = attendance?.breakSessions ?? [];
  if (!sessions.length) {
    return false;
  }

  return !sessions[sessions.length - 1]?.endedAt;
}

export function getWorkingMinutes(
  attendance?: AttendanceTiming | null,
  now: Date = new Date(),
): number {
  if (!attendance?.checkInTime) {
    return 0;
  }

  if (attendance.checkOutTime) {
    if (attendance.totalWorkingMinutes && attendance.totalWorkingMinutes > 0) {
      return attendance.totalWorkingMinutes;
    }

    const grossMinutes = calculateElapsedMinutes(
      attendance.checkInTime,
      attendance.checkOutTime,
    );
    const breakMinutes =
      attendance.totalBreakMinutes ??
      calculateBreakMinutes(attendance.breakSessions ?? [], new Date(attendance.checkOutTime));

    return Math.max(0, grossMinutes - breakMinutes);
  }

  const grossMinutes = calculateElapsedMinutes(attendance.checkInTime, now);
  const breakMinutes =
    attendance.totalBreakMinutes ?? calculateBreakMinutes(attendance.breakSessions ?? [], now);

  return Math.max(0, grossMinutes - breakMinutes);
}

export function getBreakMinutes(
  attendance?: AttendanceTiming | null,
  now: Date = new Date(),
): number {
  if (!attendance?.checkInTime) {
    return 0;
  }

  if (attendance.totalBreakMinutes != null && attendance.totalBreakMinutes >= 0) {
    if (!isAttendanceSessionActive(attendance) || !isOnBreak(attendance)) {
      return attendance.totalBreakMinutes;
    }
  }

  return calculateBreakMinutes(attendance.breakSessions ?? [], now);
}

export function formatAttendanceWorkingHours(
  attendance?: AttendanceTiming | null,
  now: Date = new Date(),
): string {
  if (!attendance?.checkInTime) {
    return '-';
  }

  const minutes = getWorkingMinutes(attendance, now);
  const formatted = formatWorkingHours(minutes);

  if (isAttendanceSessionActive(attendance)) {
    if (isOnBreak(attendance)) {
      return `${formatted} (on break)`;
    }
    return `${formatted} (running)`;
  }

  return formatted;
}

export function getAttendanceStatusPresentation(
  attendance?: Attendance | null,
  options?: { officeStartTime?: string },
): {
  status: string;
  label: string;
  lateMinutes: number;
} {
  if (!attendance?.checkInTime) {
    return {
      status: attendance?.attendanceStatus || 'absent',
      label: 'Not Marked',
      lateMinutes: 0,
    };
  }

  const lateMinutes = getEffectiveLateMinutes(attendance, options?.officeStartTime);
  const isLate = lateMinutes > 0;

  if (isOnBreak(attendance)) {
    return {
      status: isLate ? 'late' : 'present',
      label: isLate ? `On Break · Late by ${formatLateDuration(lateMinutes)}` : 'On Break',
      lateMinutes,
    };
  }

  if (isLate) {
    return {
      status: 'late',
      label: `Late by ${formatLateDuration(lateMinutes)}`,
      lateMinutes,
    };
  }

  if (attendance.attendanceStatus === 'half_day') {
    return {
      status: 'present',
      label: 'Half Day',
      lateMinutes: 0,
    };
  }

  return {
    status: 'present',
    label: 'Present',
    lateMinutes: 0,
  };
}
