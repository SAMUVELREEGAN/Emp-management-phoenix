import mongoose, { Document, Schema, Types } from 'mongoose';
import { ChatGroupType } from '../types';

export interface IChatGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  type: ChatGroupType;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  photo?: string;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  lastMessageSender?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatGroupSchema = new Schema<IChatGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['team', 'group'],
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photo: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

chatGroupSchema.index({ type: 1 });
chatGroupSchema.index({ members: 1, lastMessageAt: -1 });

export const ChatGroup = mongoose.model<IChatGroup>('ChatGroup', chatGroupSchema);
