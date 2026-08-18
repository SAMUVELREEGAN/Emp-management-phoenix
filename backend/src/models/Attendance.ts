import mongoose, { Document, Schema, Types } from 'mongoose';
import { AttendanceStatus, LocationPayload } from '../types';

export interface IBreakSession {
  startedAt: Date;
  endedAt?: Date;
}

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: LocationPayload;
  checkOutLocation?: LocationPayload;
  totalWorkingMinutes: number;
  totalBreakMinutes: number;
  breakSessions: IBreakSession[];
  overtimeMinutes: number;
  lateMinutes: number;
  isEarlyCheckout: boolean;
  earlyCheckoutRemark?: string;
  attendanceStatus: AttendanceStatus;
  isWorkFromHome: boolean;
  lastHourlyReminderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<LocationPayload>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    accuracy: { type: Number },
  },
  { _id: false },
);

const breakSessionSchema = new Schema<IBreakSession>(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
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
    totalBreakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    breakSessions: {
      type: [breakSessionSchema],
      default: [],
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
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
    isWorkFromHome: {
      type: Boolean,
      default: false,
    },
    lastHourlyReminderAt: {
      type: Date,
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
