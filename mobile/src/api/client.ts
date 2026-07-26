import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/config';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = String(error.config?.url || '');
    // Avoid double-logout / navigation races while the logout request itself fails.
    if (status === 401 && !url.includes('/auth/logout')) {
      void import('../navigation/authSession').then(({ performLogout }) => performLogout());
    }
    return Promise.reject(error);
  },
);

export default apiClient;
