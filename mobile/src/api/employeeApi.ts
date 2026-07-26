import apiClient from './client';
import type {
  ApiResponse,
  CreateEmployeePayload,
  PaginatedResponse,
  PaginationParams,
  UpdateEmployeePayload,
  User,
  UserStatus,
} from '../types';

export const employeeApi = {
  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/employees', {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ employee: User }>>(`/employees/${id}`);
    return response.data;
  },

  create: async (payload: CreateEmployeePayload, profilePhoto?: { uri: string; type?: string; name?: string }) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (profilePhoto) {
      formData.append('profilePhoto', {
        uri: profilePhoto.uri,
        type: profilePhoto.type || 'image/jpeg',
        name: profilePhoto.name || 'profile.jpg',
      } as unknown as Blob);
    }
    const response = await apiClient.post<ApiResponse<{ employee: User }>>('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateEmployeePayload,
    profilePhoto?: { uri: string; type?: string; name?: string },
  ) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    if (profilePhoto) {
      formData.append('profilePhoto', {
        uri: profilePhoto.uri,
        type: profilePhoto.type || 'image/jpeg',
        name: profilePhoto.name || 'profile.jpg',
      } as unknown as Blob);
    }
    const response = await apiClient.put<ApiResponse<{ employee: User }>>(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateStatus: async (id: string, status: UserStatus) => {
    const response = await apiClient.patch<ApiResponse<{ employee: User }>>(`/employees/${id}/status`, {
      status,
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/employees/${id}`);
    return response.data;
  },
};
