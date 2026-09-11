import mongoose, { Document, Schema } from 'mongoose';

export interface IPayrollPolicy extends Document {
  standardWorkingDaysPerMonth: number;
  weeklyOffDays: number[];
  lateDeductionPerDay: number;
  lateDeductionPerMinute: number;
  leaveDeductionEnabled: boolean;
  halfDayLeaveFactor: number;
  overtimeEnabled: boolean;
  overtimeMultiplier: number;
  overtimeHourlyDivisor: number;
  proRataJoiningExit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const payrollPolicySchema = new Schema<IPayrollPolicy>(
  {
    standardWorkingDaysPerMonth: { type: Number, default: 26, min: 1, max: 31 },
    weeklyOffDays: { type: [Number], default: [0] },
    lateDeductionPerDay: { type: Number, default: 0, min: 0 },
    lateDeductionPerMinute: { type: Number, default: 0, min: 0 },
    leaveDeductionEnabled: { type: Boolean, default: true },
    halfDayLeaveFactor: { type: Number, default: 0.5, min: 0, max: 1 },
    overtimeEnabled: { type: Boolean, default: true },
    overtimeMultiplier: { type: Number, default: 1.5, min: 1 },
    overtimeHourlyDivisor: { type: Number, default: 8, min: 1 },
    proRataJoiningExit: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PayrollPolicy = mongoose.model<IPayrollPolicy>('PayrollPolicy', payrollPolicySchema);
