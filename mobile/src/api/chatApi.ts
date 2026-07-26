import apiClient from './client';
import type {
  ApiResponse,
  ChatGroup,
  ChatMessage,
  CreateChatGroupPayload,
  PaginatedResponse,
  PaginationParams,
  User,
} from '../types';

export const chatApi = {
  listGroups: async () => {
    const response = await apiClient.get<ApiResponse<{ groups: ChatGroup[] }>>('/chat/groups');
    return response.data;
  },

  listMembers: async () => {
    const response = await apiClient.get<ApiResponse<{ members: User[] }>>('/chat/members');
    return response.data;
  },

  getGroup: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ group: ChatGroup & { members: User[] } }>>(
      `/chat/groups/${id}`,
    );
    return response.data;
  },

  createGroup: async (payload: CreateChatGroupPayload) => {
    const response = await apiClient.post<ApiResponse<{ group: ChatGroup }>>('/chat/groups', payload);
    return response.data;
  },

  updateGroup: async (id: string, payload: Partial<CreateChatGroupPayload>) => {
    const response = await apiClient.put<ApiResponse<{ group: ChatGroup }>>(
      `/chat/groups/${id}`,
      payload,
    );
    return response.data;
  },

  deleteGroup: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/chat/groups/${id}`);
    return response.data;
  },

  listMessages: async (groupId: string, params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ChatMessage>>>(
      `/chat/groups/${groupId}/messages`,
      { params },
    );
    return response.data;
  },

  sendText: async (groupId: string, content: string) => {
    const response = await apiClient.post<ApiResponse<{ message: ChatMessage }>>(
      `/chat/groups/${groupId}/messages`,
      { content },
    );
    return response.data;
  },

  sendAttachment: async (
    groupId: string,
    attachment: { uri: string; type?: string; name?: string },
    options?: { content?: string; messageType?: 'image' | 'file' | 'voice'; voiceDuration?: number },
  ) => {
    const normalizedUri =
      attachment.uri.startsWith('file://') || attachment.uri.startsWith('http')
        ? attachment.uri
        : `file://${attachment.uri}`;

    const formData = new FormData();
    formData.append('attachment', {
      uri: normalizedUri,
      type: attachment.type || 'application/octet-stream',
      name: attachment.name || 'attachment',
    } as unknown as Blob);
    if (options?.content) {
      formData.append('content', options.content);
    }
    if (options?.messageType) {
      formData.append('messageType', options.messageType);
    }
    if (options?.voiceDuration !== undefined) {
      formData.append('voiceDuration', String(options.voiceDuration));
    }
    const response = await apiClient.post<ApiResponse<{ message: ChatMessage }>>(
      `/chat/groups/${groupId}/messages/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  uploadAsset: async (attachment: { uri: string; type?: string; name?: string }) => {
    const normalizedUri =
      attachment.uri.startsWith('file://') || attachment.uri.startsWith('http')
        ? attachment.uri
        : `file://${attachment.uri}`;

    const formData = new FormData();
    formData.append('attachment', {
      uri: normalizedUri,
      type: attachment.type || 'image/jpeg',
      name: attachment.name || 'upload.jpg',
    } as unknown as Blob);
    const response = await apiClient.post<
      ApiResponse<{ url: string; name: string; mimeType: string }>
    >('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
};
