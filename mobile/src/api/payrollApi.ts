import apiClient from './client';
import type {
  ApiResponse,
  EmployeeCompensation,
  PaginatedResponse,
  PaginationParams,
  PayrollPolicy,
  PayrollRun,
  PayrollSummary,
  Payslip,
  SalaryRosterItem,
} from '../types';

export const payrollApi = {
  summary: async () => {
    const response = await apiClient.get<ApiResponse<{ summary: PayrollSummary }>>('/payroll/summary');
    return response.data;
  },

  getPolicy: async () => {
    const response = await apiClient.get<ApiResponse<{ policy: PayrollPolicy }>>('/payroll/policy');
    return response.data;
  },

  updatePolicy: async (payload: Partial<PayrollPolicy>) => {
    const response = await apiClient.put<ApiResponse<{ policy: PayrollPolicy }>>('/payroll/policy', payload);
    return response.data;
  },

  getCompensation: async (employeeId: string) => {
    const response = await apiClient.get<
      ApiResponse<{ current: EmployeeCompensation | null; history: EmployeeCompensation[] }>
    >(`/payroll/compensation/${employeeId}`);
    return response.data;
  },

  setCompensation: async (employeeId: string, monthlySalary: number, notes?: string) => {
    const response = await apiClient.put<ApiResponse<{ compensation: EmployeeCompensation }>>(
      `/payroll/compensation/${employeeId}`,
      { monthlySalary, notes },
    );
    return response.data;
  },

  createRun: async (month: number, year: number) => {
    const response = await apiClient.post<ApiResponse<{ run: PayrollRun }>>('/payroll/runs', {
      month,
      year,
    });
    return response.data;
  },

  listRuns: async (params?: PaginationParams) => {
    const response = await apiClient.get<
      ApiResponse<{ items: PayrollRun[]; total: number; page: number; limit: number }>
    >('/payroll/runs', { params });
    return response.data;
  },

  getRun: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<{ run: PayrollRun; payslips: Payslip[] }>
    >(`/payroll/runs/${id}`);
    return response.data;
  },

  generateRun: async (id: string) => {
    const response = await apiClient.post<
      ApiResponse<{ run: PayrollRun; employeeCount: number }>
    >(`/payroll/runs/${id}/generate`);
    return response.data;
  },

  finalizeRun: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
      `/payroll/runs/${id}/finalize`,
    );
    return response.data;
  },

  myPayslips: async (params?: PaginationParams) => {
    const response = await apiClient.get<
      ApiResponse<{ items: Payslip[]; total: number; page: number; limit: number }>
    >('/payroll/payslips/my', { params });
    return response.data;
  },

  getPayslip: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ payslip: Payslip }>>(
      `/payroll/payslips/${id}`,
    );
    return response.data;
  },

  downloadPayslip: async (id: string) => {
    const response = await apiClient.get<string>(`/payroll/payslips/${id}/download`, {
      responseType: 'text',
    });
    return response.data;
  },

  salaryRoster: async () => {
    const response = await apiClient.get<ApiResponse<{ roster: SalaryRosterItem[] }>>(
      '/onboarding/salary-roster',
    );
    return response.data;
  },
};
