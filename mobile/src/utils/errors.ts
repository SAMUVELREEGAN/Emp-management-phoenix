import axios, { AxiosError } from 'axios';

interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: Array<{ path?: string; message?: string }>;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;

    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    if (!axiosError.response) {
      return 'Network error. Check your internet connection.';
    }

    const status = axiosError.response.status;
    const message = axiosError.response.data?.message;
    const fieldErrors = axiosError.response.data?.errors;

    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      const details = fieldErrors
        .map(error => error.message)
        .filter(Boolean)
        .join('. ');
      if (details) {
        return details;
      }
    }

    if (message) {
      return message;
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Requested resource was not found.';
      case 422:
        return 'Validation failed. Please review your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
