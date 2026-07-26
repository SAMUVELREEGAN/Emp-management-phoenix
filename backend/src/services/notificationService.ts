import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { NotificationType } from '../types';

interface CreateNotificationInput {
  recipient: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string | Types.ObjectId;
}

export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  await Notification.create({
    recipient: input.recipient,
    title: input.title,
    message: input.message,
    type: input.type,
    relatedId: input.relatedId,
  });
};

export const createNotificationsForUsers = async (
  recipientIds: Array<string | Types.ObjectId>,
  payload: Omit<CreateNotificationInput, 'recipient'>,
): Promise<void> => {
  if (!recipientIds.length) {
    return;
  }

  await Notification.insertMany(
    recipientIds.map((recipient) => ({
      recipient,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      relatedId: payload.relatedId,
    })),
  );
};
