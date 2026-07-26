import apiClient from './client';
import type {
  ApiResponse,
  AssignTaskPayload,
  PaginatedResponse,
  PaginationParams,
  SubmitTaskPayload,
  Task,
} from '../types';

export const taskApi = {
  assign: async (payload: AssignTaskPayload) => {
    const response = await apiClient.post<ApiResponse<{ task: Task }>>('/tasks', payload);
    return response.data;
  },

  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', {
      params,
    });
    return response.data;
  },

  myTasks: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>(
      '/tasks/my-tasks',
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`);
    return response.data;
  },

  submit: async (id: string, payload: SubmitTaskPayload) => {
    const response = await apiClient.patch<ApiResponse<{ task: Task }>>(
      `/tasks/${id}/submit`,
      payload,
    );
    return response.data;
  },

  stats: async () => {
    const response = await apiClient.get<
      ApiResponse<{ stats: { assigned: number; submitted: number } }>
    >('/tasks/stats');
    return response.data;
  },
};
