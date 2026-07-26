import apiClient from './client';
import type {
  ApiResponse,
  ChangePasswordPayload,
  LoginResponse,
  ResendVerificationPayload,
  User,
  VerificationRequiredResponse,
  VerifyCodePayload,
} from '../types';

export type LoginApiResponse = LoginResponse | VerificationRequiredResponse;

export const authApi = {
  login: async (identifier: string, password: string) => {
    const response = await apiClient.post<ApiResponse<LoginApiResponse>>('/auth/login', {
      identifier: identifier.trim(),
      password,
    });
    return response.data;
  },

  verifyCode: async (payload: VerifyCodePayload) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/verify', payload);
    return response.data;
  },

  resendVerification: async (payload: ResendVerificationPayload) => {
    const response = await apiClient.post<
      ApiResponse<{
        channel: VerificationRequiredResponse['channel'];
        maskedDestination: string;
        expiresInMinutes: number;
        devCode?: string;
      }>
    >('/auth/resend-verification', payload);
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await apiClient.put<ApiResponse>('/auth/change-password', payload);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },
};
