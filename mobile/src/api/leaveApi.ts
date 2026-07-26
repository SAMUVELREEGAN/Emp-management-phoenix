import apiClient from './client';
import type {
  ApiResponse,
  CreateLeavePayload,
  LeaveRequest,
  PaginatedResponse,
  PaginationParams,
  ReviewLeavePayload,
} from '../types';

export const leaveApi = {
  create: async (payload: CreateLeavePayload) => {
    const response = await apiClient.post<ApiResponse<{ leave: LeaveRequest }>>(
      '/leave-requests',
      payload,
    );
    return response.data;
  },

  preview: async (payload: Omit<CreateLeavePayload, 'reason'>) => {
    const response = await apiClient.post<
      ApiResponse<{ duration: { totalDays: number; label: string } }>
    >('/leave-requests/preview', payload);
    return response.data;
  },

  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<LeaveRequest>>>(
      '/leave-requests',
      { params },
    );
    return response.data;
  },

  myRequests: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<LeaveRequest>>>(
      '/leave-requests/my-requests',
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ leave: LeaveRequest }>>(
      `/leave-requests/${id}`,
    );
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<{ leave: LeaveRequest }>>(
      `/leave-requests/${id}/cancel`,
    );
    return response.data;
  },

  review: async (id: string, payload: ReviewLeavePayload) => {
    const response = await apiClient.patch<ApiResponse<{ leave: LeaveRequest }>>(
      `/leave-requests/${id}/review`,
      payload,
    );
    return response.data;
  },

  stats: async () => {
    const response = await apiClient.get<
      ApiResponse<{ stats: { pending: number } }>
    >('/leave-requests/stats');
    return response.data;
  },
};
