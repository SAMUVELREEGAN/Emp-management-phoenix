import mongoose, { Document, Schema, Types } from 'mongoose';

export type ShiftReportStatus = 'submitted' | 'acknowledged';

export interface ShiftReportSnapshot {
  totalShifts: number;
  activeAssignments: number;
  employeesWithoutShift: number;
  pendingChangeRequests: number;
  shiftAttendance: Array<{
    shiftId: string;
    shiftName: string;
    shiftCode: string;
    assignedCount: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    notCheckedIn: number;
  }>;
}

export interface IShiftReport extends Document {
  _id: Types.ObjectId;
  submittedBy: Types.ObjectId;
  periodFrom: Date;
  periodTo: Date;
  title: string;
  notes: string;
  snapshot: ShiftReportSnapshot;
  status: ShiftReportStatus;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shiftReportSnapshotSchema = new Schema<ShiftReportSnapshot>(
  {
    totalShifts: { type: Number, required: true },
    activeAssignments: { type: Number, required: true },
    employeesWithoutShift: { type: Number, required: true },
    pendingChangeRequests: { type: Number, required: true },
    shiftAttendance: {
      type: [
        {
          shiftId: { type: String, required: true },
          shiftName: { type: String, required: true },
          shiftCode: { type: String, required: true },
          assignedCount: { type: Number, required: true },
          present: { type: Number, required: true },
          late: { type: Number, required: true },
          absent: { type: Number, required: true },
          onLeave: { type: Number, required: true },
          notCheckedIn: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const shiftReportSchema = new Schema<IShiftReport>(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    periodFrom: {
      type: Date,
      required: true,
    },
    periodTo: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    snapshot: {
      type: shiftReportSnapshotSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'acknowledged'],
      default: 'submitted',
      index: true,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

shiftReportSchema.index({ createdAt: -1 });

export const ShiftReport = mongoose.model<IShiftReport>('ShiftReport', shiftReportSchema);
