import mongoose, { Document, Schema, Types } from 'mongoose';

export type PayrollRunStatus = 'draft' | 'finalized';

export interface IPayrollRun extends Document {
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  status: PayrollRunStatus;
  generatedBy: Types.ObjectId;
  finalizedAt?: Date;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft', index: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    finalizedAt: { type: Date },
    employeeCount: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
  },
  { timestamps: true },
);

payrollRunSchema.index({ year: 1, month: 1 }, { unique: true });

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', payrollRunSchema);
