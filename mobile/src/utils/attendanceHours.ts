import type { Attendance } from '../types';
import { formatLateDuration, formatWorkingHours } from './dates';

type AttendanceTiming = Pick<
  Attendance,
  'checkInTime' | 'checkOutTime' | 'totalWorkingMinutes'
>;

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
    return calculateElapsedMinutes(attendance.checkInTime, attendance.checkOutTime);
  }

  return calculateElapsedMinutes(attendance.checkInTime, now);
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
    return `${formatted} (running)`;
  }

  return formatted;
}

export function getAttendanceStatusPresentation(attendance?: Attendance | null): {
  status: string;
  label: string;
} {
  if (!attendance?.checkInTime) {
    return {
      status: attendance?.attendanceStatus || 'absent',
      label: 'Not Marked',
    };
  }

  if (attendance.checkOutTime) {
    const hoursLabel = formatAttendanceWorkingHours(attendance);
    const status =
      attendance.attendanceStatus === 'late' ? 'late' : 'present';

    return {
      status,
      label: hoursLabel,
    };
  }

  if (attendance.attendanceStatus === 'late' && attendance.lateMinutes) {
    return {
      status: 'late',
      label: `Late (${formatLateDuration(attendance.lateMinutes)})`,
    };
  }

  if (attendance.attendanceStatus === 'half_day') {
    return {
      status: 'present',
      label: formatAttendanceWorkingHours(attendance),
    };
  }

  return {
    status: attendance.attendanceStatus || 'present',
    label: attendance.attendanceStatus === 'late' ? 'Late' : 'Present',
  };
}
