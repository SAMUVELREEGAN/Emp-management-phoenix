import apiClient from './client';
import type { AnnouncementAudience, ApiResponse } from '../types';

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  audience: AnnouncementAudience;
}

export const announcementApi = {
  send: async (payload: CreateAnnouncementPayload) => {
    const response = await apiClient.post<
      ApiResponse<{ recipientCount: number }>
    >('/announcements', payload);
    return response.data;
  },
};
