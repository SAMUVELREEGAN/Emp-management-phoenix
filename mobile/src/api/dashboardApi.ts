import apiClient from './client';
import type { AdminDashboardData, ApiResponse, EmployeeDashboardData } from '../types';

export const dashboardApi = {
  adminDashboard: async () => {
    const response = await apiClient.get<ApiResponse<AdminDashboardData>>('/dashboard/admin');
    return response.data;
  },

  employeeDashboard: async () => {
    const response = await apiClient.get<ApiResponse<EmployeeDashboardData>>('/dashboard/employee');
    return response.data;
  },
};
