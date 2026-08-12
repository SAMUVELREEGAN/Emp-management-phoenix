import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  VerifyCode: {
    identifier: string;
    channel: 'email' | 'sms';
    maskedDestination: string;
    devCode?: string;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
};

export type ChatStackParamList = {
  ChatHub: undefined;
  CreateChatGroup: { groupId?: string } | undefined;
};

export type EmployeeAttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceHistory: undefined;
};

export type EmployeeLeaveStackParamList = {
  LeaveList: undefined;
  LeaveRequestForm: undefined;
  LeaveDetail: { leaveId: string };
};

export type EmployeeTasksStackParamList = {
  MyTasks: undefined;
  EmployeeTaskDetail: { taskId: string };
};

export type EmployeeReportsStackParamList = {
  WorkReportList: undefined;
  WorkReportForm: { reportId?: string };
  WorkReportDetail: { reportId: string };
};

export type EmployeeHomeStackParamList = {
  Dashboard: undefined;
  Tasks: NavigatorScreenParams<EmployeeTasksStackParamList>;
  Leave: NavigatorScreenParams<EmployeeLeaveStackParamList>;
  Notifications: { returnToHome?: boolean } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type EmployeeMoreStackParamList = {
  MoreHub: undefined;
  Tasks: NavigatorScreenParams<EmployeeTasksStackParamList>;
  Leave: NavigatorScreenParams<EmployeeLeaveStackParamList>;
  Notifications: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type EmployeeTabParamList = {
  Home: NavigatorScreenParams<EmployeeHomeStackParamList>;
  Attendance: NavigatorScreenParams<EmployeeAttendanceStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Reports: NavigatorScreenParams<EmployeeReportsStackParamList>;
  More: NavigatorScreenParams<EmployeeMoreStackParamList>;
};

export type AdminEmployeesStackParamList = {
  EmployeeList: undefined;
  EmployeeForm: { employeeId?: string; defaultRole?: 'employee' | 'hr' };
  EmployeeDetail: { employeeId: string };
};

export type AdminAttendanceStackParamList = {
  AttendanceOverview: undefined;
  AttendanceDetail: { attendanceId: string };
};

export type AdminReportsStackParamList = {
  AdminWorkReportList: undefined;
  AdminWorkReportDetail: { reportId: string };
};

export type AdminTasksStackParamList = {
  AdminTaskList: undefined;
  TaskAssign: undefined;
  AdminTaskDetail: { taskId: string };
};

export type AdminLeaveStackParamList = {
  LeaveApprovalList: undefined;
  LeaveApprovalDetail: { leaveId: string };
};

export type AdminTrackStackParamList = {
  TrackEmployees: undefined;
  EmployeeRouteTrack: { employeeId: string; employeeName: string };
};

export type AdminNotificationsStackParamList = {
  NotificationsMain: undefined;
  SendAnnouncement: undefined;
};

export type AdminHomeStackParamList = {
  Dashboard: undefined;
  Tasks: NavigatorScreenParams<AdminTasksStackParamList>;
  Leave: NavigatorScreenParams<AdminLeaveStackParamList>;
  Track: NavigatorScreenParams<AdminTrackStackParamList>;
  Reports: NavigatorScreenParams<AdminReportsStackParamList>;
  Notifications: NavigatorScreenParams<AdminNotificationsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type AdminMoreStackParamList = {
  MoreHub: undefined;
  Tasks: NavigatorScreenParams<AdminTasksStackParamList>;
  Leave: NavigatorScreenParams<AdminLeaveStackParamList>;
  Track: NavigatorScreenParams<AdminTrackStackParamList>;
  Reports: NavigatorScreenParams<AdminReportsStackParamList>;
  Notifications: NavigatorScreenParams<AdminNotificationsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type AdminTabParamList = {
  Home: NavigatorScreenParams<AdminHomeStackParamList>;
  Employees: NavigatorScreenParams<AdminEmployeesStackParamList>;
  Attendance: NavigatorScreenParams<AdminAttendanceStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  More: NavigatorScreenParams<AdminMoreStackParamList>;
};

export type HrEmployeesStackParamList = {
  EmployeeList: undefined;
  EmployeeDetail: { employeeId: string };
};

export type HrAttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceHistory: undefined;
  AttendanceDetail: { attendanceId: string };
};

export type HrReportsStackParamList = {
  HrReportsMain: undefined;
  AdminWorkReportDetail: { reportId: string };
};

export type HrHomeStackParamList = {
  Dashboard: undefined;
  Reports: NavigatorScreenParams<HrReportsStackParamList>;
  Notifications: { returnToHome?: boolean } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HrMoreStackParamList = {
  MoreHub: undefined;
  Reports: NavigatorScreenParams<HrReportsStackParamList>;
  Notifications: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HrTabParamList = {
  Home: NavigatorScreenParams<HrHomeStackParamList>;
  Employees: NavigatorScreenParams<HrEmployeesStackParamList>;
  Attendance: NavigatorScreenParams<HrAttendanceStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  More: NavigatorScreenParams<HrMoreStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Employee: NavigatorScreenParams<EmployeeTabParamList>;
  Admin: NavigatorScreenParams<AdminTabParamList>;
  Hr: NavigatorScreenParams<HrTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
