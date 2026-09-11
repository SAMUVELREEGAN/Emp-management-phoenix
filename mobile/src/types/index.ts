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
export type WorkReportType = 'daily_work' | 'attendance_summary' | 'hourly_work';

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
  | 'chat'
  | 'shift'
  | 'payroll'
  | 'onboarding';

export type ShiftChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ShiftReportStatus = 'submitted' | 'acknowledged';

export interface Shift {
  _id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingDays: number[];
  graceMinutes: number;
  breakDurationMinutes: number;
  description?: string;
  color: string;
  isActive: boolean;
  createdBy?: UserSummary | string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftStats {
  totalShifts: number;
  activeAssignments: number;
  pendingChangeRequests: number;
  employeesWithoutShift: number;
}

export interface ShiftAssignment {
  _id: string;
  employee: UserSummary | string;
  shift: Shift | string;
  effectiveFrom: string;
  effectiveTo?: string;
  assignedBy?: UserSummary | string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftChangeRequest {
  _id: string;
  employee: UserSummary | string;
  currentShift: Shift | string;
  requestedShift: Shift | string;
  effectiveDate: string;
  reason: string;
  status: ShiftChangeRequestStatus;
  reviewedBy?: UserSummary | string;
  adminComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftReportSnapshotItem {
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  assignedCount: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  notCheckedIn: number;
}

export interface ShiftReportSnapshot {
  totalShifts: number;
  activeAssignments: number;
  employeesWithoutShift: number;
  pendingChangeRequests: number;
  shiftAttendance: ShiftReportSnapshotItem[];
}

export interface ShiftReport {
  _id: string;
  submittedBy: UserSummary | string;
  periodFrom: string;
  periodTo: string;
  title: string;
  notes?: string;
  snapshot: ShiftReportSnapshot;
  status: ShiftReportStatus;
  acknowledgedBy?: UserSummary | string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeShiftHours {
  shiftId?: string;
  shiftName?: string;
  shiftCode?: string;
  officeStartTime: string;
  officeEndTime: string;
  graceMinutes: number;
  breakDurationMinutes: number;
  workingDays: number[];
  isShiftAssigned: boolean;
}

export interface ShiftAttendanceEmployee {
  employee: UserSummary;
  attendance?: Attendance | null;
  status: 'present' | 'late' | 'absent' | 'on_leave' | 'not_checked_in';
}

export interface ShiftAttendanceData {
  shift: Shift;
  date: string;
  summary: {
    assignedCount: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    notCheckedIn: number;
  };
  employees: ShiftAttendanceEmployee[];
}

export interface CreateShiftPayload {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingDays: number[];
  graceMinutes?: number;
  breakDurationMinutes?: number;
  description?: string;
  color?: string;
}

export interface AssignShiftPayload {
  shiftId: string;
  employeeIds: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

export interface CreateShiftChangeRequestPayload {
  requestedShiftId: string;
  effectiveDate: string;
  reason: string;
}

export interface ReviewShiftChangeRequestPayload {
  status: 'approved' | 'rejected';
  adminComment?: string;
}

export interface SubmitShiftReportPayload {
  periodFrom: string;
  periodTo: string;
  title: string;
  notes?: string;
}

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
  locationTimestamp?: string;
  isMocked?: boolean;
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
  isFieldEmployee?: boolean;
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
  lastHourlyReminderAt?: string;
  isEarlyCheckout?: boolean;
  earlyCheckoutRemark?: string;
  attendanceStatus: AttendanceStatus;
  isWorkFromHome?: boolean;
  isManualCorrection?: boolean;
  correctionRemark?: string;
  correctedBy?: UserSummary | string;
  correctedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkReport {
  _id: string;
  employee: UserSummary | string;
  reportDate: string;
  reportType?: WorkReportType;
  reportPeriodStart?: string;
  reportPeriodEnd?: string;
  title: string;
  workSummary: string;
  completedTasks: string;
  pendingTasks: string;
  blockers: string;
  tomorrowPlan: string;
  workingHours: number;
  attendanceSummary?: AttendanceSummarySnapshot;
  attachment?: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    capturedAt?: string;
  };
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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface PasswordResetCodeResponse {
  maskedDestination: string;
  expiresInMinutes: number;
  devCode?: string;
}

export interface CheckInOutPayload {
  location: LocationPayload;
  deviceTimestamp?: string;
  deviceTimezoneOffset?: number;
  earlyCheckoutRemark?: string;
  workFromHome?: boolean;
}

export interface AttendanceCorrectionPayload {
  employeeId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  correctionRemark: string;
  attendanceId?: string;
}

export interface OfficeHours {
  officeStartTime: string;
  officeEndTime: string;
  geofenceEnabled?: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters?: number;
  officeLocationName?: string;
  hourlyReportReminderEnabled?: boolean;
  hourlyReportReminderIntervalMinutes?: number;
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
  isFieldEmployee?: boolean;
  monthlySalary?: number;
  enableOnboarding?: boolean;
}

export type OnboardingStatus =
  | 'pending_documents'
  | 'submitted'
  | 'hr_review'
  | 'approved'
  | 'rejected';

export interface EmployeeOnboarding {
  _id: string;
  employee: UserSummary | string;
  status: OnboardingStatus;
  proposedMonthlySalary: number;
  approvedMonthlySalary?: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  panNumber?: string;
  employeeNotes?: string;
  hrNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: UserSummary | string;
  sharedWithAdmin: boolean;
  sharedWithAdminAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OnboardingDocumentCategory =
  | 'id_proof'
  | 'address_proof'
  | 'bank_proof'
  | 'education'
  | 'other';

export interface OnboardingDocument {
  _id: string;
  employee: string;
  category: OnboardingDocumentCategory;
  title: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  createdAt: string;
}

export interface PayrollPolicy {
  standardWorkingDaysPerMonth: number;
  weeklyOffDays: number[];
  lateDeductionPerDay: number;
  lateDeductionPerMinute: number;
  leaveDeductionEnabled: boolean;
  halfDayLeaveFactor: number;
  overtimeEnabled: boolean;
  overtimeMultiplier: number;
  overtimeHourlyDivisor: number;
  proRataJoiningExit: boolean;
}

export interface EmployeeCompensation {
  _id: string;
  employee: string;
  monthlySalary: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  notes?: string;
}

export type PayrollRunStatus = 'draft' | 'finalized';

export interface PayrollRun {
  _id: string;
  month: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  finalizedAt?: string;
  createdAt: string;
}

export interface PayslipLineItem {
  code: string;
  label: string;
  amount: number;
  source?: string;
}

export interface Payslip {
  _id: string;
  payrollRun: string | PayrollRun;
  employee: UserSummary | string;
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
  workingDays: {
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    halfDays: number;
    holidays: number;
    payableDays: number;
  };
  attendanceSummary: {
    lateDays: number;
    totalLateMinutes: number;
    overtimeMinutes: number;
  };
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: 'draft' | 'published';
  publishedAt?: string;
}

export interface SalaryRosterItem {
  employeeId: string;
  fullName: string;
  employeeCode: string;
  department: string;
  designation: string;
  monthlySalary: number;
  sharedWithAdminAt?: string;
  reviewedAt?: string;
}

export interface PayrollSummary {
  activeEmployees: number;
  employeesWithSalary: number;
  latestPayrollRun?: PayrollRun | null;
  pendingOnboardingReviews: number;
}

export interface MonthlyAttendanceStats {
  month: number;
  year: number;
  label: string;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  totalMarked: number;
  totalLateMinutes: number;
  workingDays: number;
}

export interface MonthlyAttendanceSummary {
  currentMonth: MonthlyAttendanceStats;
  previousMonth: MonthlyAttendanceStats;
}

export type AssistantQuestionId =
  | 'leave-balance'
  | 'check-in-yesterday'
  | 'hours-this-month'
  | 'pending-tasks'
  | 'frequent-late'
  | 'increasing-absenteeism'
  | 'low-task-completion'
  | 'excessive-overtime';

export interface AssistantQuestion {
  id: AssistantQuestionId;
  label: string;
  category: 'employee' | 'hr';
}

export interface AssistantQuestionsData {
  category: 'employee' | 'hr';
  questions: AssistantQuestion[];
}

export interface AssistantAnswer {
  questionId: AssistantQuestionId;
  question: string;
  answer: string;
  generatedAt: string;
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
