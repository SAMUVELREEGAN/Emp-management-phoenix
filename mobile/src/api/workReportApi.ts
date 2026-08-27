import apiClient from './client';
import type {
  ApiResponse,
  HrAttendanceReportPayload,
  PaginatedResponse,
  PaginationParams,
  ReviewReportPayload,
  WorkReport,
  WorkReportFormPayload,
} from '../types';

export const workReportApi = {
  create: async (
    payload: WorkReportFormPayload,
    attachment?: { uri: string; type?: string; name?: string },
  ) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (attachment) {
      formData.append('attachment', {
        uri: attachment.uri,
        type: attachment.type || 'image/jpeg',
        name: attachment.name || 'attachment.jpg',
      } as unknown as Blob);
    }
    const response = await apiClient.post<ApiResponse<{ report: WorkReport }>>(
      '/work-reports',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  myReports: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WorkReport>>>(
      '/work-reports/my-reports',
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ report: WorkReport }>>(
      `/work-reports/${id}`,
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: WorkReportFormPayload,
    attachment?: { uri: string; type?: string; name?: string },
  ) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (attachment) {
      formData.append('attachment', {
        uri: attachment.uri,
        type: attachment.type || 'image/jpeg',
        name: attachment.name || 'attachment.jpg',
      } as unknown as Blob);
    }
    const response = await apiClient.put<ApiResponse<{ report: WorkReport }>>(
      `/work-reports/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  submit: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<{ report: WorkReport }>>(
      `/work-reports/${id}/submit`,
    );
    return response.data;
  },

  createHrAttendanceReport: async (payload: HrAttendanceReportPayload) => {
    const response = await apiClient.post<ApiResponse<{ report: WorkReport }>>(
      '/work-reports/hr-attendance-summary',
      payload,
    );
    return response.data;
  },

  createHourly: async (
    payload: {
      workSummary?: string;
      reportPeriodStart?: string;
      reportPeriodEnd?: string;
      workingHours?: number;
      latitude: number;
      longitude: number;
      address?: string;
      accuracy?: number;
      capturedAt?: string;
    },
    attachment: { uri: string; type?: string; name?: string },
  ) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('attachment', {
      uri: attachment.uri,
      type: attachment.type || 'image/jpeg',
      name: attachment.name || 'geocam.jpg',
    } as unknown as Blob);
    const response = await apiClient.post<ApiResponse<{ report: WorkReport }>>(
      '/work-reports/hourly',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
    );
    return response.data;
  },

  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<WorkReport>>>(
      '/work-reports',
      { params },
    );
    return response.data;
  },

  review: async (id: string, payload: ReviewReportPayload) => {
    const response = await apiClient.patch<ApiResponse<{ report: WorkReport }>>(
      `/work-reports/${id}/review`,
      payload,
    );
    return response.data;
  },
};
