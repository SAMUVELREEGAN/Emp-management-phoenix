import mongoose, { Document, Schema, Types } from 'mongoose';

export type ShiftChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IShiftChangeRequest extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  currentShift: Types.ObjectId;
  requestedShift: Types.ObjectId;
  effectiveDate: Date;
  reason: string;
  status: ShiftChangeRequestStatus;
  reviewedBy?: Types.ObjectId;
  adminComment?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shiftChangeRequestSchema = new Schema<IShiftChangeRequest>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentShift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    requestedShift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
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
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminComment: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

shiftChangeRequestSchema.index({ employee: 1, createdAt: -1 });
shiftChangeRequestSchema.index({ status: 1, createdAt: -1 });

export const ShiftChangeRequest = mongoose.model<IShiftChangeRequest>(
  'ShiftChangeRequest',
  shiftChangeRequestSchema,
);
