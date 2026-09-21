import axios from 'axios';
import apiClient from './client';
import type { ApiResponse, Notification, NotificationListData, PaginationParams } from '../types';

export const notificationApi = {
  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<NotificationListData>>('/notifications', {
      params,
    });
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<{ notification: Notification }>>(
      `/notifications/${id}/read`,
    );
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.patch<ApiResponse>('/notifications/read-all');
    return response.data;
  },

  deleteAll: async () => {
    try {
      const response = await apiClient.post<ApiResponse>('/notifications/clear-all');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const response = await apiClient.delete<ApiResponse>('/notifications');
        return response.data;
      }
      throw error;
    }
  },
};
