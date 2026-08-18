import { CommonActions } from '@react-navigation/native';
import type { Notification, UserRole } from '../types';
import { navigationRef } from './navigationRef';

type AppRoot = 'Employee' | 'Admin' | 'Hr';

function getAppRoot(role: UserRole): AppRoot {
  if (role === 'admin') {
    return 'Admin';
  }
  if (role === 'hr') {
    return 'Hr';
  }
  return 'Employee';
}

function navigateRoot(root: AppRoot, params: object): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: root,
      params,
    }),
  );

  return true;
}

function navigateTabScreen(
  root: AppRoot,
  tab: string,
  screen: string,
  params?: object,
): boolean {
  return navigateRoot(root, {
    screen: tab,
    params: {
      screen,
      params,
    },
  });
}

function navigateNestedScreen(
  root: AppRoot,
  tab: string,
  stack: string,
  screen: string,
  params?: object,
): boolean {
  return navigateRoot(root, {
    screen: tab,
    params: {
      screen: stack,
      params: {
        screen,
        params,
      },
    },
  });
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
  const root = getAppRoot(role);
  const { type, relatedId } = notification;

  switch (type) {
    case 'leave': {
      if (isNewLeaveRequest(notification)) {
        if (relatedId) {
          return navigateNestedScreen(root, 'More', 'Leave', 'LeaveApprovalDetail', {
            leaveId: relatedId,
          });
        }
        return navigateNestedScreen(root, 'More', 'Leave', 'LeaveApprovalList');
      }

      if (role === 'employee') {
        if (relatedId) {
          return navigateNestedScreen(root, 'More', 'Leave', 'LeaveDetail', {
            leaveId: relatedId,
          });
        }
        return navigateNestedScreen(root, 'More', 'Leave', 'LeaveList');
      }

      if (relatedId) {
        return navigateNestedScreen(root, 'More', 'Leave', 'LeaveApprovalDetail', {
          leaveId: relatedId,
        });
      }
      return navigateNestedScreen(root, 'More', 'Leave', 'LeaveApprovalList');
    }

    case 'task': {
      if (role === 'employee') {
        if (relatedId) {
          return navigateNestedScreen(root, 'More', 'Tasks', 'EmployeeTaskDetail', {
            taskId: relatedId,
          });
        }
        return navigateNestedScreen(root, 'More', 'Tasks', 'MyTasks');
      }

      if (relatedId) {
        return navigateNestedScreen(root, 'More', 'Tasks', 'AdminTaskDetail', {
          taskId: relatedId,
        });
      }
      return navigateNestedScreen(root, 'More', 'Tasks', 'AdminTaskList');
    }

    case 'work_report': {
      if (role === 'employee') {
        if (isHourlyReportDue(notification)) {
          return navigateTabScreen(root, 'Reports', 'HourlyReportForm', {
            periodEnd: new Date().toISOString(),
          });
        }

        if (relatedId) {
          return navigateTabScreen(root, 'Reports', 'WorkReportDetail', {
            reportId: relatedId,
          });
        }

        return navigateTabScreen(
          root,
          'Reports',
          'WorkReportList',
          isHourlyReportSubmitted(notification) ? { reportKind: 'hourly' } : undefined,
        );
      }

      if (relatedId) {
        return navigateNestedScreen(root, 'More', 'Reports', 'AdminWorkReportDetail', {
          reportId: relatedId,
        });
      }

      return navigateNestedScreen(root, 'More', 'Reports', 'AdminWorkReportList');
    }

    case 'attendance': {
      if (role === 'employee') {
        return navigateTabScreen(root, 'Attendance', 'AttendanceMain');
      }

      if (relatedId) {
        return navigateTabScreen(root, 'Attendance', 'AttendanceDetail', {
          attendanceId: relatedId,
        });
      }

      if (role === 'hr') {
        return navigateTabScreen(root, 'Attendance', 'AttendanceMain');
      }

      return navigateTabScreen(root, 'Attendance', 'AttendanceOverview');
    }

    case 'chat': {
      return navigateTabScreen(
        root,
        'Chat',
        'ChatHub',
        relatedId ? { groupId: relatedId } : undefined,
      );
    }

    case 'employee': {
      return navigateNestedScreen(root, 'More', 'Profile', 'ProfileMain');
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
