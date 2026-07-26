import apiClient from './client';
import type { ApiResponse, OfficeHours } from '../types';

export const settingsApi = {
  getOfficeHours: async () => {
    const response = await apiClient.get<ApiResponse<{ officeHours: OfficeHours }>>(
      '/settings/office-hours',
    );
    return response.data;
  },

  updateOfficeHours: async (payload: OfficeHours) => {
    const response = await apiClient.put<ApiResponse<{ officeHours: OfficeHours }>>(
      '/settings/office-hours',
      payload,
    );
    return response.data;
  },
};
