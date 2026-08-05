import { Attendance } from '../models/Attendance';
import { ChatGroup } from '../models/ChatGroup';
import { ChatMessage } from '../models/ChatMessage';
import { LeaveRequest } from '../models/LeaveRequest';
import { Notification } from '../models/Notification';
import { OfficeSettings } from '../models/OfficeSettings';
import { RoutePoint } from '../models/RoutePoint';
import { RouteSession } from '../models/RouteSession';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { VerificationCode } from '../models/VerificationCode';
import { WorkReport } from '../models/WorkReport';
import { logger } from '../utils/logger';
import { clearOfficeHoursCache } from '../services/officeSettingsService';
import { ensureDefaultAdmin } from './ensureDefaultAdmin';

export const ADMIN_EMAIL = 'admin@company.com';

export interface DemoDataResetSummary {
  attendance: number;
  workReports: number;
  tasks: number;
  leaves: number;
  notifications: number;
  chatMessages: number;
  chatGroups: number;
  routePoints: number;
  routeSessions: number;
  verificationCodes: number;
  officeSettings: number;
  otherUsers: number;
}

export const clearDemoData = async (): Promise<DemoDataResetSummary> => {
  const admin = await User.findOne({ email: ADMIN_EMAIL }).select('_id email');
  if (!admin) {
    logger.warn(`Admin ${ADMIN_EMAIL} not found. It will be recreated.`);
  }

  const [
    attendance,
    workReports,
    tasks,
    leaves,
    notifications,
    chatMessages,
    chatGroups,
    routePoints,
    routeSessions,
    verificationCodes,
    officeSettings,
    otherUsers,
  ] = await Promise.all([
    Attendance.deleteMany({}),
    WorkReport.deleteMany({}),
    Task.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Notification.deleteMany({}),
    ChatMessage.deleteMany({}),
    ChatGroup.deleteMany({}),
    RoutePoint.deleteMany({}),
    RouteSession.deleteMany({}),
    VerificationCode.deleteMany({}),
    OfficeSettings.deleteMany({}),
    User.deleteMany({ email: { $ne: ADMIN_EMAIL } }),
  ]);

  await ensureDefaultAdmin();
  clearOfficeHoursCache();

  const summary: DemoDataResetSummary = {
    attendance: attendance.deletedCount,
    workReports: workReports.deletedCount,
    tasks: tasks.deletedCount,
    leaves: leaves.deletedCount,
    notifications: notifications.deletedCount,
    chatMessages: chatMessages.deletedCount,
    chatGroups: chatGroups.deletedCount,
    routePoints: routePoints.deletedCount,
    routeSessions: routeSessions.deletedCount,
    verificationCodes: verificationCodes.deletedCount,
    officeSettings: officeSettings.deletedCount,
    otherUsers: otherUsers.deletedCount,
  };

  logger.info('Demo data reset complete.');
  logger.info(`Kept admin: ${ADMIN_EMAIL}`);
  logger.info(
    Object.entries(summary)
      .map(([key, value]) => `${key}=${value}`)
      .join(', '),
  );

  return summary;
};
