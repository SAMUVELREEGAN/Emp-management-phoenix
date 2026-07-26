import apiClient from './client';
import type {
  ApiResponse,
  LocationPayload,
  PaginatedResponse,
  RoutePoint,
  RouteSession,
  TrackableEmployee,
} from '../types';

export const routeApi = {
  appendPoints: async (points: LocationPayload[]) => {
    const response = await apiClient.post<ApiResponse<{ session: RouteSession }>>(
      '/routes/points',
      {
        points: points.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
          address: point.address,
          recordedAt: new Date().toISOString(),
        })),
      },
    );
    return response.data;
  },

  mySession: async () => {
    const response = await apiClient.get<ApiResponse<{ session: RouteSession | null }>>(
      '/routes/my-session',
    );
    return response.data;
  },

  live: async () => {
    const response = await apiClient.get<
      ApiResponse<{ live: Array<Record<string, unknown>> }>
    >('/routes/live');
    return response.data;
  },

  listEmployees: async () => {
    const response = await apiClient.get<
      ApiResponse<{ employees: TrackableEmployee[] }>
    >('/routes/employees');
    return response.data;
  },

  employeeToday: async (employeeId: string) => {
    const response = await apiClient.get<
      ApiResponse<{ session: RouteSession | null; points: RoutePoint[] }>
    >(`/routes/employee/${employeeId}/today`);
    return response.data;
  },

  employeeHistory: async (employeeId: string, page = 1, limit = 20) => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<RouteSession>>
    >(`/routes/employee/${employeeId}/history`, { params: { page, limit } });
    return response.data;
  },

  session: async (sessionId: string) => {
    const response = await apiClient.get<
      ApiResponse<{ session: RouteSession; points: RoutePoint[] }>
    >(`/routes/session/${sessionId}`);
    return response.data;
  },

  historyByDate: async (employeeId: string, date: string) => {
    const response = await apiClient.get<
      ApiResponse<{ session: RouteSession | null; points: RoutePoint[] }>
    >(`/routes/employee/${employeeId}/date`, { params: { date } });
    return response.data;
  },
};
