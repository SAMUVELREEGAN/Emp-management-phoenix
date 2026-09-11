import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    email: string;
    maskedDestination: string;
    devCode?: string;
  };
  VerifyCode: {
    identifier: string;
    channel: 'email' | 'sms';
    maskedDestination: string;
    devCode?: string;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type ChatStackParamList = {
  ChatHub: { groupId?: string; returnToHome?: boolean } | undefined;
  CreateChatGroup: { groupId?: string } | undefined;
};

export type EmployeeAttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceHistory: undefined;
  AttendanceSummary: undefined;
  MyShift: undefined;
  ShiftChangeRequestForm: undefined;
  ShiftChangeRequestList: undefined;
};

export type EmployeePayrollStackParamList = {
  EmployeeOnboarding: undefined;
  PayslipList: undefined;
  PayslipDetail: { payslipId: string };
};

export type PayrollStackParamList = {
  HrPayrollHub: undefined;
  AdminSalaryRoster: undefined;
  PayrollPolicySettings: undefined;
  OnboardingReviewList: undefined;
  OnboardingReviewDetail: { employeeId: string };
  PayrollRunList: undefined;
  PayrollRunDetail: { runId: string };
  PayrollRunCreate: undefined;
};

export type AdminShiftsStackParamList = {
  HrShiftsHub: undefined;
  ShiftList: undefined;
  ShiftForm: { shiftId?: string };
  ShiftDetail: { shiftId: string };
  ShiftAssignment: { shiftId: string };
  ShiftAttendance: { shiftId: string; shiftName: string };
  ShiftChangeRequestList: undefined;
  ShiftChangeRequestDetail: { requestId: string };
  ShiftReportList: undefined;
  ShiftReportForm: undefined;
  ShiftReportDetail: { reportId: string };
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
  WorkReportList: { reportKind?: 'daily' | 'hourly'; returnToHome?: boolean } | undefined;
  WorkReportForm: { reportId?: string };
  HourlyReportForm: { periodStart?: string; periodEnd?: string };
  WorkReportDetail: { reportId: string };
};

export type EmployeeHomeStackParamList = {
  Dashboard: undefined;
  Tasks: NavigatorScreenParams<EmployeeTasksStackParamList>;
  Leave: NavigatorScreenParams<EmployeeLeaveStackParamList>;
  Payroll: NavigatorScreenParams<EmployeePayrollStackParamList>;
  Notifications: { returnToHome?: boolean } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type EmployeeMoreStackParamList = {
  MoreHub: undefined;
  AiAssistant: undefined;
  Tasks: NavigatorScreenParams<EmployeeTasksStackParamList>;
  Leave: NavigatorScreenParams<EmployeeLeaveStackParamList>;
  Payroll: NavigatorScreenParams<EmployeePayrollStackParamList>;
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
  AttendanceCorrection: {
    employeeId: string;
    employeeName: string;
    date: string;
    attendanceId?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
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
  Shifts: NavigatorScreenParams<AdminShiftsStackParamList>;
  Payroll: NavigatorScreenParams<PayrollStackParamList>;
  Notifications: NavigatorScreenParams<AdminNotificationsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type AdminMoreStackParamList = {
  MoreHub: undefined;
  AiAssistant: undefined;
  Tasks: NavigatorScreenParams<AdminTasksStackParamList>;
  Leave: NavigatorScreenParams<AdminLeaveStackParamList>;
  Track: NavigatorScreenParams<AdminTrackStackParamList>;
  Reports: NavigatorScreenParams<AdminReportsStackParamList>;
  Shifts: NavigatorScreenParams<AdminShiftsStackParamList>;
  Payroll: NavigatorScreenParams<PayrollStackParamList>;
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
  AttendanceCorrection: {
    employeeId: string;
    employeeName: string;
    date: string;
    attendanceId?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
};

export type HrReportsStackParamList = {
  HrReportsMain: undefined;
  AdminWorkReportDetail: { reportId: string };
};

export type HrLeaveStackParamList = {
  LeaveApprovalList: undefined;
  LeaveApprovalDetail: { leaveId: string };
};

export type HrHomeStackParamList = {
  Dashboard: undefined;
  Leave: NavigatorScreenParams<HrLeaveStackParamList>;
  Reports: NavigatorScreenParams<HrReportsStackParamList>;
  Shifts: NavigatorScreenParams<AdminShiftsStackParamList>;
  Payroll: NavigatorScreenParams<PayrollStackParamList>;
  Notifications: { returnToHome?: boolean } | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HrMoreStackParamList = {
  MoreHub: undefined;
  AiAssistant: undefined;
  Leave: NavigatorScreenParams<HrLeaveStackParamList>;
  Reports: NavigatorScreenParams<HrReportsStackParamList>;
  Shifts: NavigatorScreenParams<AdminShiftsStackParamList>;
  Payroll: NavigatorScreenParams<PayrollStackParamList>;
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
