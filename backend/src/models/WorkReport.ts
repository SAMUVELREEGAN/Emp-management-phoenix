import mongoose, { Document, Schema, Types } from 'mongoose';
import { WorkReportStatus } from '../types';

export type WorkReportType = 'daily_work' | 'attendance_summary' | 'hourly_work';

export interface AttendanceSummarySnapshot {
  present: number;
  absent: number;
  late: number;
  checkedOut: number;
  activeEmployees: number;
}

export interface IWorkReport extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  reportDate: Date;
  reportType: WorkReportType;
  reportPeriodStart?: Date;
  reportPeriodEnd?: Date;
  title: string;
  workSummary: string;
  completedTasks: string;
  pendingTasks: string;
  blockers: string;
  tomorrowPlan: string;
  workingHours: number;
  attendanceSummary?: AttendanceSummarySnapshot;
  attachment?: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    capturedAt?: Date;
  };
  status: WorkReportStatus;
  adminComment?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workReportSchema = new Schema<IWorkReport>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    reportType: {
      type: String,
      enum: ['daily_work', 'attendance_summary', 'hourly_work'],
      default: 'daily_work',
    },
    reportPeriodStart: {
      type: Date,
    },
    reportPeriodEnd: {
      type: Date,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    workSummary: {
      type: String,
      required: true,
      trim: true,
    },
    completedTasks: {
      type: String,
      default: '',
      trim: true,
    },
    pendingTasks: {
      type: String,
      default: '',
      trim: true,
    },
    blockers: {
      type: String,
      default: '',
      trim: true,
    },
    tomorrowPlan: {
      type: String,
      default: '',
      trim: true,
    },
    workingHours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    attendanceSummary: {
      present: { type: Number, min: 0, default: 0 },
      absent: { type: Number, min: 0, default: 0 },
      late: { type: Number, min: 0, default: 0 },
      checkedOut: { type: Number, min: 0, default: 0 },
      activeEmployees: { type: Number, min: 0, default: 0 },
    },
    attachment: {
      type: String,
      default: '',
    },
    geoLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, default: '' },
      accuracy: { type: Number },
      capturedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    adminComment: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

workReportSchema.index(
  { employee: 1, reportDate: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['submitted', 'approved', 'rejected'] },
      reportType: { $in: ['daily_work', 'attendance_summary'] },
    },
  },
);

workReportSchema.index(
  { employee: 1, reportPeriodStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['submitted', 'approved', 'rejected'] },
      reportType: 'hourly_work',
    },
  },
);

workReportSchema.index({ status: 1, reportDate: -1 });

export const WorkReport = mongoose.model<IWorkReport>(
  'WorkReport',
  workReportSchema,
);
