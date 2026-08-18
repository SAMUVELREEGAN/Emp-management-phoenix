import type { ChatMessage } from '../types';

export function getChatSenderId(
  sender: ChatMessage['sender'] | null | undefined,
): string | undefined {
  if (!sender) {
    return undefined;
  }
  return typeof sender === 'string' ? sender : sender._id;
}

export function getChatSenderName(
  sender: ChatMessage['sender'] | null | undefined,
): string {
  if (!sender) {
    return 'Unknown user';
  }
  if (typeof sender === 'string') {
    return 'User';
  }
  return sender.fullName?.trim() || 'User';
}

export function getChatAvatarColors(name: string): { bg: string; text: string } {
  const palette = [
    { bg: '#FFF3CD', text: '#7A5C00' },
    { bg: '#E8F4FD', text: '#1565C0' },
    { bg: '#E8F5E9', text: '#2E7D32' },
    { bg: '#F3E5F5', text: '#6A1B9A' },
    { bg: '#FFEBEE', text: '#C62828' },
    { bg: '#E0F2F1', text: '#00695C' },
    { bg: '#FFF8E1', text: '#F57F17' },
    { bg: '#E8EAF6', text: '#283593' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}
