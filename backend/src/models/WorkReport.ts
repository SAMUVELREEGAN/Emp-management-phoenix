import mongoose, { Document, Schema, Types } from 'mongoose';
import { WorkReportStatus } from '../types';

export type WorkReportType = 'daily_work' | 'attendance_summary';

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
  title: string;
  workSummary: string;
  completedTasks: string;
  pendingTasks: string;
  blockers: string;
  tomorrowPlan: string;
  workingHours: number;
  attendanceSummary?: AttendanceSummarySnapshot;
  attachment?: string;
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
      enum: ['daily_work', 'attendance_summary'],
      default: 'daily_work',
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
    },
  },
);

workReportSchema.index({ status: 1, reportDate: -1 });

export const WorkReport = mongoose.model<IWorkReport>(
  'WorkReport',
  workReportSchema,
);
