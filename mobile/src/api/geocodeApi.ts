import apiClient from './client';
import type { ApiResponse, LocationPayload } from '../types';

export const geocodeApi = {
  reverse: async (latitude: number, longitude: number) => {
    const response = await apiClient.get<
      ApiResponse<{ location: LocationPayload }>
    >('/geocode/reverse', {
      params: { lat: latitude, lon: longitude },
      timeout: 15000,
    });
    return response.data;
  },
};
