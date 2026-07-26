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
