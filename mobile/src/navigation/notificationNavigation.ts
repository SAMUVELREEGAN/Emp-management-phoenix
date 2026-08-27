import { CommonActions } from '@react-navigation/native';
import type { Notification, UserRole } from '../types';
import { navigationRef } from './navigationRef';

function navigateNested(
  tab: string,
  stack: string,
  screen: string,
  params?: object,
): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: tab,
      params: {
        screen: stack,
        params: {
          screen,
          params,
        },
      },
    }),
  );

  return true;
}

function navigateTabScreen(tab: string, screen: string, params?: object): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: tab,
      params: {
        screen,
        params,
      },
    }),
  );

  return true;
}

function isHourlyReportDue(notification: Notification): boolean {
  return notification.title.toLowerCase().includes('hourly report due');
}

function isHourlyReportSubmitted(notification: Notification): boolean {
  return notification.title.toLowerCase().includes('hourly work report');
}

function isNewLeaveRequest(notification: Notification): boolean {
  return notification.title.toLowerCase().includes('new leave request');
}

export function navigateFromNotification(
  notification: Notification,
  role: UserRole,
): boolean {
  const { type, relatedId } = notification;

  switch (type) {
    case 'leave': {
      if (isNewLeaveRequest(notification)) {
        if (relatedId) {
          return navigateNested('More', 'Leave', 'LeaveApprovalDetail', {
            leaveId: relatedId,
          });
        }
        return navigateNested('More', 'Leave', 'LeaveApprovalList');
      }

      if (role === 'employee') {
        if (relatedId) {
          return navigateNested('More', 'Leave', 'LeaveDetail', {
            leaveId: relatedId,
          });
        }
        return navigateNested('More', 'Leave', 'LeaveList');
      }

      if (relatedId) {
        return navigateNested('More', 'Leave', 'LeaveApprovalDetail', {
          leaveId: relatedId,
        });
      }
      return navigateNested('More', 'Leave', 'LeaveApprovalList');
    }

    case 'task': {
      if (role === 'employee') {
        if (relatedId) {
          return navigateNested('More', 'Tasks', 'EmployeeTaskDetail', {
            taskId: relatedId,
          });
        }
        return navigateNested('More', 'Tasks', 'MyTasks');
      }

      if (relatedId) {
        return navigateNested('More', 'Tasks', 'AdminTaskDetail', {
          taskId: relatedId,
        });
      }
      return navigateNested('More', 'Tasks', 'AdminTaskList');
    }

    case 'work_report': {
      if (role === 'employee') {
        if (isHourlyReportDue(notification)) {
          return navigateTabScreen('Reports', 'HourlyReportForm', {
            periodEnd: new Date().toISOString(),
          });
        }

        if (relatedId) {
          return navigateTabScreen('Reports', 'WorkReportDetail', {
            reportId: relatedId,
          });
        }

        return navigateTabScreen(
          'Reports',
          'WorkReportList',
          isHourlyReportSubmitted(notification) ? { reportKind: 'hourly' } : undefined,
        );
      }

      if (relatedId) {
        return navigateNested('More', 'Reports', 'AdminWorkReportDetail', {
          reportId: relatedId,
        });
      }

      return navigateNested('More', 'Reports', 'AdminWorkReportList');
    }

    case 'attendance': {
      if (role === 'employee') {
        return navigateTabScreen('Attendance', 'AttendanceMain');
      }

      if (relatedId) {
        return navigateTabScreen('Attendance', 'AttendanceDetail', {
          attendanceId: relatedId,
        });
      }

      if (role === 'hr') {
        return navigateTabScreen('Attendance', 'AttendanceMain');
      }

      return navigateTabScreen('Attendance', 'AttendanceOverview');
    }

    case 'chat': {
      return navigateTabScreen(
        'Chat',
        'ChatHub',
        relatedId ? { groupId: relatedId } : undefined,
      );
    }

    case 'employee': {
      return navigateNested('More', 'Profile', 'ProfileMain');
    }

    case 'announcement':
    case 'system':
    default:
      return false;
  }
}

export function getNotificationTargetLabel(notification: Notification): string | undefined {
  switch (notification.type) {
    case 'leave':
      return isNewLeaveRequest(notification) ? 'View leave request' : 'View leave';
    case 'task':
      return 'View task';
    case 'work_report':
      return isHourlyReportDue(notification) ? 'Submit hourly report' : 'View report';
    case 'attendance':
      return 'View attendance';
    case 'chat':
      return 'Open chat';
    case 'employee':
      return 'View profile';
    default:
      return undefined;
  }
}
