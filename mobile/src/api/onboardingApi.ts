import apiClient from './client';
import type {
  ApiResponse,
  EmployeeOnboarding,
  OnboardingDocument,
  PaginationParams,
  SalaryRosterItem,
} from '../types';

export const onboardingApi = {
  status: async () => {
    const response = await apiClient.get<
      ApiResponse<{
        needsOnboarding: boolean;
        onboarding: EmployeeOnboarding | null;
        documents: OnboardingDocument[];
      }>
    >('/onboarding/status');
    return response.data;
  },

  my: async () => {
    const response = await apiClient.get<
      ApiResponse<{ onboarding: EmployeeOnboarding | null; documents: OnboardingDocument[] }>
    >('/onboarding/my');
    return response.data;
  },

  updateMy: async (payload: {
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
    panNumber?: string;
    employeeNotes?: string;
  }) => {
    const response = await apiClient.patch<ApiResponse<{ onboarding: EmployeeOnboarding }>>(
      '/onboarding/my',
      payload,
    );
    return response.data;
  },

  uploadDocument: async (
    file: { uri: string; type?: string; name?: string },
    category: string,
    title?: string,
  ) => {
    const formData = new FormData();
    formData.append('document', {
      uri: file.uri,
      type: file.type || 'application/pdf',
      name: file.name || 'document.pdf',
    } as unknown as Blob);
    formData.append('category', category);
    if (title) {
      formData.append('title', title);
    }
    const response = await apiClient.post<ApiResponse<{ document: OnboardingDocument }>>(
      '/onboarding/documents',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  submit: async () => {
    const response = await apiClient.post<ApiResponse<{ onboarding: EmployeeOnboarding }>>(
      '/onboarding/submit',
    );
    return response.data;
  },

  listForReview: async (params?: PaginationParams & { status?: string }) => {
    const response = await apiClient.get<
      ApiResponse<{ items: EmployeeOnboarding[]; total: number; page: number; limit: number }>
    >('/onboarding/review', { params });
    return response.data;
  },

  getByEmployee: async (employeeId: string) => {
    const response = await apiClient.get<
      ApiResponse<{ onboarding: EmployeeOnboarding; documents: OnboardingDocument[] }>
    >(`/onboarding/employee/${employeeId}`);
    return response.data;
  },

  review: async (
    employeeId: string,
    payload: {
      status: 'approved' | 'rejected' | 'hr_review';
      approvedMonthlySalary?: number;
      hrNotes?: string;
    },
  ) => {
    const response = await apiClient.patch<ApiResponse<{ onboarding: EmployeeOnboarding }>>(
      `/onboarding/employee/${employeeId}/review`,
      payload,
    );
    return response.data;
  },

  updateSalary: async (employeeId: string, monthlySalary: number, notes?: string) => {
    const response = await apiClient.patch<ApiResponse<{ onboarding: EmployeeOnboarding }>>(
      `/onboarding/employee/${employeeId}/salary`,
      { monthlySalary, notes },
    );
    return response.data;
  },

  shareWithAdmin: async () => {
    const response = await apiClient.post<ApiResponse<{ roster: SalaryRosterItem[] }>>(
      '/onboarding/share-admin',
    );
    return response.data;
  },
};
