import mongoose, { Document, Schema, Types } from 'mongoose';

export type PayslipStatus = 'draft' | 'published';

export interface PayslipLineItem {
  code: string;
  label: string;
  amount: number;
  source?: string;
}

export interface PayslipWorkingDays {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  holidays: number;
  payableDays: number;
}

export interface PayslipAttendanceSummary {
  lateDays: number;
  totalLateMinutes: number;
  overtimeMinutes: number;
}

export interface IPayslip extends Document {
  payrollRun: Types.ObjectId;
  employee: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  month: number;
  year: number;
  workingDays: PayslipWorkingDays;
  attendanceSummary: PayslipAttendanceSummary;
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<PayslipLineItem>(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    source: { type: String },
  },
  { _id: false },
);

const payslipSchema = new Schema<IPayslip>(
  {
    payrollRun: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    workingDays: {
      totalWorkingDays: { type: Number, required: true },
      presentDays: { type: Number, required: true },
      absentDays: { type: Number, required: true },
      leaveDays: { type: Number, required: true },
      halfDays: { type: Number, required: true },
      holidays: { type: Number, required: true },
      payableDays: { type: Number, required: true },
    },
    attendanceSummary: {
      lateDays: { type: Number, required: true },
      totalLateMinutes: { type: Number, required: true },
      overtimeMinutes: { type: Number, required: true },
    },
    earnings: { type: [lineItemSchema], default: [] },
    deductions: { type: [lineItemSchema], default: [] },
    grossPay: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

payslipSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
payslipSchema.index({ employee: 1, year: -1, month: -1 });

export const Payslip = mongoose.model<IPayslip>('Payslip', payslipSchema);
