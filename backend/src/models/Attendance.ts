import mongoose, { Document, Schema, Types } from 'mongoose';
import { AttendanceStatus, LocationPayload } from '../types';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: LocationPayload;
  checkOutLocation?: LocationPayload;
  totalWorkingMinutes: number;
  lateMinutes: number;
  isEarlyCheckout: boolean;
  earlyCheckoutRemark?: string;
  attendanceStatus: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<LocationPayload>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    checkInLocation: {
      type: locationSchema,
    },
    checkOutLocation: {
      type: locationSchema,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEarlyCheckout: {
      type: Boolean,
      default: false,
    },
    earlyCheckoutRemark: {
      type: String,
      default: '',
      trim: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['present', 'late', 'absent', 'half_day', 'on_leave'],
      default: 'present',
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, attendanceStatus: 1 });

export const Attendance = mongoose.model<IAttendance>(
  'Attendance',
  attendanceSchema,
);
