export type UserRole = 'admin' | 'employee' | 'hr';
export type UserStatus = 'active' | 'inactive';

export type AttendanceBreakdownCategory = 'present' | 'absent' | 'late' | 'checked_out';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'on_leave';

export type WorkReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type WorkReportType = 'daily_work' | 'attendance_summary';

export interface AttendanceSummarySnapshot {
  present: number;
  absent: number;
  late: number;
  checkedOut: number;
  activeEmployees: number;
}

export type NotificationType =
  | 'attendance'
  | 'work_report'
  | 'system'
  | 'employee'
  | 'task'
  | 'leave'
  | 'announcement'
  | 'chat';

export type AnnouncementAudience = 'all' | 'employees' | 'hr';

export type ChatGroupType = 'team' | 'group';
export type ChatMessageType = 'text' | 'image' | 'file' | 'voice';

export type TaskStatus = 'assigned' | 'submitted';
export type TaskCompletionStatus = 'completed' | 'partial';
export type LeaveType = 'full_day' | 'half_day';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LocationPayload {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export interface User {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  profilePhoto?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  fullName: string;
  employeeId: string;
  department?: string;
  designation?: string;
  email?: string;
  role?: UserRole;
}

export interface BreakSession {
  startedAt: string;
  endedAt?: string;
}

export interface Attendance {
  _id: string;
  employee: UserSummary | string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: LocationPayload;
  checkOutLocation?: LocationPayload;
  totalWorkingMinutes: number;
  totalBreakMinutes?: number;
  breakSessions?: BreakSession[];
  overtimeMinutes?: number;
  lateMinutes?: number;
  isEarlyCheckout?: boolean;
  earlyCheckoutRemark?: string;
  attendanceStatus: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkReport {
  _id: string;
  employee: UserSummary | string;
  reportDate: string;
  reportType?: WorkReportType;
  title: string;
  workSummary: string;
  completedTasks: string;
  pendingTasks: string;
  blockers: string;
  tomorrowPlan: string;
  workingHours: number;
  attendanceSummary?: AttendanceSummarySnapshot;
  attachment?: string;
  status: WorkReportStatus;
  adminComment?: string;
  reviewedBy?: UserSummary | string;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface NotificationListData extends PaginatedResponse<Notification> {
  unreadCount: number;
}

export interface AttendanceRoleSummary {
  active: number;
  present: number;
  absent: number;
  late: number;
  checkedOut: number;
}

export interface AttendanceSummary {
  totalEmployees: number;
  activeEmployees: number;
  totalHr: number;
  activeHr: number;
  totalStaff: number;
  activeStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  checkedOutToday: number;
  employees: AttendanceRoleSummary;
  hr: AttendanceRoleSummary;
  date: string;
}

export interface WorkReportStats {
  submittedToday: number;
  awaitingApproval: number;
}

export interface AdminDashboardData {
  summary: AttendanceSummary & WorkReportStats;
  officeHours: OfficeHours;
  recentAttendance: Attendance[];
  recentReports: WorkReport[];
}

export interface AttendanceSummaryItem {
  _id: AttendanceStatus;
  count: number;
}

export interface EmployeeDashboardData {
  todayAttendance: Attendance | null;
  officeHours: OfficeHours;
  todayReport: WorkReport | null;
  recentReports: WorkReport[];
  attendanceSummary: AttendanceSummaryItem[];
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type VerificationChannel = 'email' | 'sms';

export interface VerificationRequiredResponse {
  requiresVerification: true;
  channel: VerificationChannel;
  maskedDestination: string;
  identifier: string;
  expiresInMinutes: number;
  devCode?: string;
}

export interface VerifyCodePayload {
  identifier: string;
  code: string;
}

export interface ResendVerificationPayload {
  identifier: string;
}

export interface CheckInOutPayload {
  location: LocationPayload;
  deviceTimestamp?: string;
  deviceTimezoneOffset?: number;
  earlyCheckoutRemark?: string;
}

export interface OfficeHours {
  officeStartTime: string;
  officeEndTime: string;
  geofenceEnabled?: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters?: number;
  officeLocationName?: string;
}

export interface TodayAttendanceData {
  attendance: Attendance | null;
  officeHours: OfficeHours;
}

export interface CreateEmployeePayload {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  joiningDate: string;
  address?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateEmployeePayload extends Partial<Omit<CreateEmployeePayload, 'password'>> {
  password?: string;
}

export interface WorkReportFormPayload {
  reportDate: string;
  title: string;
  workSummary: string;
  completedTasks?: string;
  pendingTasks?: string;
  blockers?: string;
  tomorrowPlan?: string;
  workingHours: number;
  status?: 'draft' | 'submitted';
}

export interface HrAttendanceReportPayload {
  reportDate: string;
  workSummary?: string;
  attendanceSummary: AttendanceSummarySnapshot;
  status?: 'draft' | 'submitted';
}

export interface ReviewReportPayload {
  status: 'approved' | 'rejected';
  adminComment?: string;
}

export interface Task {
  _id: string;
  assignedTo: UserSummary | string;
  assignedBy: UserSummary | string;
  title: string;
  description: string;
  dueDate?: string;
  status: TaskStatus;
  completionStatus?: TaskCompletionStatus;
  employeeRemark?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  _id: string;
  employee: UserSummary | string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  halfDayHours?: number;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  adminComment?: string;
  reviewedBy?: UserSummary | string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignTaskPayload {
  assignedTo: string;
  title: string;
  description: string;
  dueDate?: string;
}

export interface SubmitTaskPayload {
  completionStatus: TaskCompletionStatus;
  employeeRemark: string;
}

export interface CreateLeavePayload {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  halfDayHours?: number;
  reason: string;
}

export interface ReviewLeavePayload {
  status: 'approved' | 'rejected';
  adminComment?: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address?: string;
  recordedAt: string;
  sequence?: number;
}

export interface RouteSession {
  _id: string;
  employee: UserSummary | string;
  attendance: string;
  date: string;
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastAddress?: string;
  lastRecordedAt?: string;
  pointCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackableEmployee {
  employee: UserSummary;
  isLive: boolean;
  sessionId?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastAddress?: string;
  lastRecordedAt?: string;
  pointCount: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  attendanceStatus?: string;
  role?: Extract<UserRole, 'employee' | 'hr'>;
  reportType?: WorkReportType;
}

export interface ChatGroup {
  _id: string;
  name: string;
  type: ChatGroupType;
  members: string[];
  createdBy: string;
  photo?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSender?: UserSummary | string;
  memberCount?: number;
  isTeamChat?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  groupId: string;
  sender: UserSummary | string | null;
  messageType: ChatMessageType;
  content?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  voiceDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatGroupPayload {
  name: string;
  memberIds: string[];
  photo?: string;
}
