import mongoose, { Document, Schema, Types } from 'mongoose';
import { ChatMessageType } from '../types';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  sender: Types.ObjectId;
  messageType: ChatMessageType;
  content?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  voiceDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatGroup',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'voice'],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentName: {
      type: String,
      default: '',
    },
    attachmentMimeType: {
      type: String,
      default: '',
    },
    voiceDuration: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ groupId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
