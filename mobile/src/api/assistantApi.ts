import apiClient from './client';
import type { ApiResponse, AssistantAnswer, AssistantQuestionsData } from '../types';

export const assistantApi = {
  getQuestions: async () => {
    const response = await apiClient.get<ApiResponse<AssistantQuestionsData>>(
      '/assistant/questions',
    );
    return response.data;
  },

  ask: async (questionId: string) => {
    const response = await apiClient.post<ApiResponse<AssistantAnswer>>('/assistant/ask', {
      questionId,
    });
    return response.data;
  },
};
