import apiClient from './client';
import type {
  ApiResponse,
  AssignShiftPayload,
  CreateShiftChangeRequestPayload,
  CreateShiftPayload,
  EmployeeShiftHours,
  PaginatedResponse,
  PaginationParams,
  ReviewShiftChangeRequestPayload,
  Shift,
  ShiftAssignment,
  ShiftAttendanceData,
  ShiftChangeRequest,
  ShiftReport,
  ShiftStats,
  SubmitShiftReportPayload,
} from '../types';

interface ShiftListResponse {
  items: Shift[];
  total: number;
  page: number;
  limit: number;
}

interface AssignmentListResponse {
  items: ShiftAssignment[];
  total: number;
  page: number;
  limit: number;
}

interface ChangeRequestListResponse {
  items: ShiftChangeRequest[];
  total: number;
  page: number;
  limit: number;
}

interface ShiftReportListResponse {
  items: ShiftReport[];
  total: number;
  page: number;
  limit: number;
}

export const shiftApi = {
  stats: async () => {
    const response = await apiClient.get<ApiResponse<{ stats: ShiftStats }>>('/shifts/stats');
    return response.data;
  },

  list: async (params?: PaginationParams & { activeOnly?: boolean }) => {
    const response = await apiClient.get<ApiResponse<ShiftListResponse>>('/shifts', { params });
    return response.data;
  },

  listActive: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<ShiftListResponse>>('/shifts/active', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ shift: Shift }>>(`/shifts/${id}`);
    return response.data;
  },

  create: async (payload: CreateShiftPayload) => {
    const response = await apiClient.post<ApiResponse<{ shift: Shift }>>('/shifts', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<CreateShiftPayload> & { isActive?: boolean }) => {
    const response = await apiClient.put<ApiResponse<{ shift: Shift }>>(`/shifts/${id}`, payload);
    return response.data;
  },

  assign: async (payload: AssignShiftPayload) => {
    const response = await apiClient.post<ApiResponse<{ assignments: ShiftAssignment[] }>>(
      '/shifts/assignments',
      payload,
    );
    return response.data;
  },

  listAssignments: async (params?: PaginationParams & { shiftId?: string }) => {
    const response = await apiClient.get<ApiResponse<AssignmentListResponse>>(
      '/shifts/assignments/list',
      { params },
    );
    return response.data;
  },

  myShift: async () => {
    const response = await apiClient.get<
      ApiResponse<{ assignment: ShiftAssignment | null; shiftHours: EmployeeShiftHours }>
    >('/shifts/my-shift');
    return response.data;
  },

  createChangeRequest: async (payload: CreateShiftChangeRequestPayload) => {
    const response = await apiClient.post<ApiResponse<{ request: ShiftChangeRequest }>>(
      '/shifts/change-requests',
      payload,
    );
    return response.data;
  },

  myChangeRequests: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<ChangeRequestListResponse>>(
      '/shifts/change-requests/my',
      { params },
    );
    return response.data;
  },

  listChangeRequests: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<ChangeRequestListResponse>>(
      '/shifts/change-requests',
      { params },
    );
    return response.data;
  },

  getChangeRequest: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ request: ShiftChangeRequest }>>(
      `/shifts/change-requests/${id}`,
    );
    return response.data;
  },

  reviewChangeRequest: async (id: string, payload: ReviewShiftChangeRequestPayload) => {
    const response = await apiClient.patch<ApiResponse<{ request: ShiftChangeRequest }>>(
      `/shifts/change-requests/${id}/review`,
      payload,
    );
    return response.data;
  },

  cancelChangeRequest: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<{ request: ShiftChangeRequest }>>(
      `/shifts/change-requests/${id}/cancel`,
    );
    return response.data;
  },

  getShiftAttendance: async (shiftId: string, date: string) => {
    const response = await apiClient.get<ApiResponse<ShiftAttendanceData>>(
      `/shifts/${shiftId}/attendance`,
      { params: { date } },
    );
    return response.data;
  },

  submitReport: async (payload: SubmitShiftReportPayload) => {
    const response = await apiClient.post<ApiResponse<{ report: ShiftReport }>>(
      '/shifts/reports',
      payload,
    );
    return response.data;
  },

  listReports: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<ShiftReportListResponse>>(
      '/shifts/reports/list',
      { params },
    );
    return response.data;
  },

  getReport: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ report: ShiftReport }>>(
      `/shifts/reports/${id}`,
    );
    return response.data;
  },

  acknowledgeReport: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<{ report: ShiftReport }>>(
      `/shifts/reports/${id}/acknowledge`,
    );
    return response.data;
  },
};
