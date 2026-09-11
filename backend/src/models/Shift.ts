import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShift extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingDays: number[];
  graceMinutes: number;
  breakDurationMinutes: number;
  description: string;
  color: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    workingDays: {
      type: [Number],
      required: true,
      validate: {
        validator: (days: number[]) =>
          days.length > 0 && days.every(day => day >= 0 && day <= 6),
        message: 'Working days must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    graceMinutes: {
      type: Number,
      default: 10,
      min: 0,
      max: 120,
    },
    breakDurationMinutes: {
      type: Number,
      default: 60,
      min: 0,
      max: 240,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#2563EB',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

shiftSchema.index({ name: 1 });

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);
