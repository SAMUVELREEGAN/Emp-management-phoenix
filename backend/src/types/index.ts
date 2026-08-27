export type UserRole = 'admin' | 'employee' | 'hr';
export type UserStatus = 'active' | 'inactive';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'wfh';

export type WorkReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

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

export interface LocationPayload {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  locationTimestamp?: string;
  isMocked?: boolean;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
}
