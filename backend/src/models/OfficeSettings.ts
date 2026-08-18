import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOfficeSettings extends Document {
  _id: Types.ObjectId;
  officeStartTime: string;
  officeEndTime: string;
  geofenceEnabled: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters: number;
  officeLocationName?: string;
  hourlyReportReminderEnabled: boolean;
  hourlyReportReminderIntervalMinutes: number;
  hourlyReportReminderIntervalHours?: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const officeSettingsSchema = new Schema<IOfficeSettings>(
  {
    officeStartTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
      default: '09:30',
    },
    officeEndTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
      default: '18:00',
    },
    geofenceEnabled: {
      type: Boolean,
      default: false,
    },
    officeLatitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    officeLongitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    geofenceRadiusMeters: {
      type: Number,
      default: 200,
      min: 25,
      max: 5000,
    },
    officeLocationName: {
      type: String,
      default: '',
      trim: true,
    },
    hourlyReportReminderEnabled: {
      type: Boolean,
      default: true,
    },
    hourlyReportReminderIntervalMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 480,
    },
    hourlyReportReminderIntervalHours: {
      type: Number,
      min: 1,
      max: 8,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export const OfficeSettings = mongoose.model<IOfficeSettings>(
  'OfficeSettings',
  officeSettingsSchema,
);
