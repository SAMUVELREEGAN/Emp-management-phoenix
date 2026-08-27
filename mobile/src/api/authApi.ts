import apiClient from './client';
import type {
  ApiResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginResponse,
  PasswordResetCodeResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
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

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const response = await apiClient.post<ApiResponse<PasswordResetCodeResponse>>(
      '/auth/forgot-password',
      payload,
    );
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', payload);
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

  updateProfile: async (
    payload: { fullName?: string },
    profilePhoto?: { uri: string; type?: string; name?: string },
  ) => {
    const formData = new FormData();
    if (payload.fullName !== undefined && payload.fullName.trim()) {
      formData.append('fullName', payload.fullName.trim());
    }
    if (profilePhoto) {
      formData.append('profilePhoto', {
        uri: profilePhoto.uri,
        type: profilePhoto.type || 'image/jpeg',
        name: profilePhoto.name || 'profile.jpg',
      } as unknown as Blob);
    }
    const response = await apiClient.patch<ApiResponse<{ user: User }>>('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },
};
