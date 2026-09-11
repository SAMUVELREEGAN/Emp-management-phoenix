import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShiftAssignment extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  shift: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  assignedBy: Types.ObjectId;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftAssignmentSchema = new Schema<IShiftAssignment>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

shiftAssignmentSchema.index({ employee: 1, isActive: 1, effectiveFrom: -1 });
shiftAssignmentSchema.index({ shift: 1, isActive: 1 });

export const ShiftAssignment = mongoose.model<IShiftAssignment>(
  'ShiftAssignment',
  shiftAssignmentSchema,
);
