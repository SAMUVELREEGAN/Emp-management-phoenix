import apiClient from './client';
import type {
  ApiResponse,
  Attendance,
  AttendanceBreakdownCategory,
  AttendanceCorrectionPayload,
  AttendanceSummary,
  CheckInOutPayload,
  PaginatedResponse,
  PaginationParams,
  TodayAttendanceData,
  MonthlyAttendanceSummary,
} from '../types';

export const attendanceApi = {
  checkIn: async (payload: CheckInOutPayload) => {
    const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
      '/attendance/check-in',
      payload,
    );
    return response.data;
  },

  checkOut: async (payload: CheckInOutPayload) => {
    const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
      '/attendance/check-out',
      payload,
    );
    return response.data;
  },

  startBreak: async (deviceTimestamp?: string) => {
    const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
      '/attendance/start-break',
      { deviceTimestamp },
    );
    return response.data;
  },

  endBreak: async (deviceTimestamp?: string) => {
    const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
      '/attendance/end-break',
      { deviceTimestamp },
    );
    return response.data;
  },

  today: async () => {
    const response = await apiClient.get<ApiResponse<TodayAttendanceData>>(
      '/attendance/today',
    );
    return response.data;
  },

  myMonthlySummary: async () => {
    const response = await apiClient.get<ApiResponse<MonthlyAttendanceSummary>>(
      '/attendance/my-monthly-summary',
    );
    return response.data;
  },

  myHistory: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Attendance>>>(
      '/attendance/my-history',
      { params },
    );
    return response.data;
  },

  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Attendance>>>(
      '/attendance',
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ attendance: Attendance }>>(
      `/attendance/${id}`,
    );
    return response.data;
  },

  summary: async (date?: string) => {
    const response = await apiClient.get<ApiResponse<{ summary: AttendanceSummary }>>(
      '/attendance/summary',
      { params: date ? { date } : undefined },
    );
    return response.data;
  },

  breakdown: async (params: {
    date: string;
    role: 'employee' | 'hr';
    category: AttendanceBreakdownCategory;
  }) => {
    const response = await apiClient.get<
      ApiResponse<{
        items: Attendance[];
        category: AttendanceBreakdownCategory;
        date: string;
        role: 'employee' | 'hr';
      }>
    >('/attendance/breakdown', { params });
    return response.data;
  },

  exportReport: async (params: {
    fromDate: string;
    toDate: string;
    role: 'employee' | 'hr';
  }) => {
    const response = await apiClient.get<
      ApiResponse<{
        filename: string;
        mimeType: string;
        base64: string;
      }>
    >('/attendance/export', { params, timeout: 60000 });
    return response.data;
  },

  correct: async (payload: AttendanceCorrectionPayload) => {
    const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
      '/attendance/correct',
      payload,
    );
    return response.data;
  },
};
