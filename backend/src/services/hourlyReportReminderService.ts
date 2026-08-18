import { Attendance } from '../models/Attendance';
import { WorkReport } from '../models/WorkReport';
import {
  getMinutesFromDate,
  isOnBreak,
  parseTimeToMinutes,
} from '../utils/dateHelpers';
import { logger } from '../utils/logger';
import { createNotification } from './notificationService';
import { getOfficeHours } from './officeSettingsService';
import {
  formatReminderIntervalLabel,
  normalizeReminderIntervalMinutes,
} from '../utils/reminderInterval';

function isWithinOfficeHours(
  now: Date,
  officeStartTime: string,
  officeEndTime: string,
): boolean {
  const minutes = getMinutesFromDate(now);
  return (
    minutes >= parseTimeToMinutes(officeStartTime) &&
    minutes <= parseTimeToMinutes(officeEndTime)
  );
}

function formatReminderTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export async function processHourlyReportReminders(): Promise<void> {
  const settings = await getOfficeHours();
  if (!settings.hourlyReportReminderEnabled) {
    return;
  }

  const intervalMinutes = normalizeReminderIntervalMinutes(
    settings.hourlyReportReminderIntervalMinutes,
  );
  const intervalMs = intervalMinutes * 60 * 1000;
  const now = new Date();

  const activeSessions = await Attendance.find({
    checkInTime: { $exists: true, $ne: null },
    checkOutTime: { $exists: false },
  }).populate('employee', 'fullName role status');

  for (const attendance of activeSessions) {
    const employee = attendance.employee as {
      _id?: { toString(): string };
      fullName?: string;
      role?: string;
      status?: string;
    } | null;

    if (!employee || employee.status !== 'active' || employee.role !== 'employee') {
      continue;
    }

    if (isOnBreak(attendance.breakSessions)) {
      continue;
    }

    if (
      !isWithinOfficeHours(
        now,
        settings.officeStartTime,
        settings.officeEndTime,
      )
    ) {
      continue;
    }

    const checkInTime = attendance.checkInTime;
    if (!checkInTime) {
      continue;
    }

    const lastHourlyReport = await WorkReport.findOne({
      employee: attendance.employee,
      reportType: 'hourly_work',
      status: { $in: ['submitted', 'approved', 'rejected'] },
      submittedAt: { $gte: checkInTime },
    })
      .sort({ submittedAt: -1 })
      .select('submittedAt');

    const anchorTimes = [checkInTime.getTime()];
    if (lastHourlyReport?.submittedAt) {
      anchorTimes.push(new Date(lastHourlyReport.submittedAt).getTime());
    }
    if (attendance.lastHourlyReminderAt) {
      anchorTimes.push(new Date(attendance.lastHourlyReminderAt).getTime());
    }

    const anchor = Math.max(...anchorTimes);
    if (now.getTime() - anchor < intervalMs) {
      continue;
    }

    if (
      attendance.lastHourlyReminderAt &&
      now.getTime() - new Date(attendance.lastHourlyReminderAt).getTime() < 60_000
    ) {
      continue;
    }

    const employeeId = employee._id?.toString();
    if (!employeeId) {
      continue;
    }

    await createNotification({
      recipient: employeeId,
      title: 'Hourly report due',
      message: `Kindly send your hourly work report to Admin and HR. You checked in at ${formatReminderTime(checkInTime)} and it has been ${formatReminderIntervalLabel(intervalMinutes)} since your last update.`,
      type: 'work_report',
      relatedId: attendance._id,
    });

    attendance.lastHourlyReminderAt = now;
    await attendance.save();
  }
}

export function startHourlyReportReminderScheduler(): void {
  const pollMs = 5 * 60 * 1000;

  setInterval(() => {
    processHourlyReportReminders().catch((error) => {
      logger.warn('Hourly report reminder job failed', error);
    });
  }, pollMs);

  processHourlyReportReminders().catch((error) => {
    logger.warn('Initial hourly report reminder job failed', error);
  });
}

export async function resetHourlyReminderState(attendanceId: string): Promise<void> {
  await Attendance.findByIdAndUpdate(attendanceId, {
    $unset: { lastHourlyReminderAt: 1 },
  });
}
