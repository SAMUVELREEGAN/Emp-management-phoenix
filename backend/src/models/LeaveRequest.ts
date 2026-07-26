import mongoose, { Document, Schema, Types } from 'mongoose';

export type LeaveType = 'full_day' | 'half_day';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ILeaveRequest extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  leaveType: LeaveType;
  fromDate: Date;
  toDate: Date;
  halfDayHours?: number;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  adminComment?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['full_day', 'half_day'],
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    halfDayHours: {
      type: Number,
      min: 1,
      max: 8,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    adminComment: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ status: 1, fromDate: -1 });
leaveRequestSchema.index({ employee: 1, createdAt: -1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>(
  'LeaveRequest',
  leaveRequestSchema,
);
