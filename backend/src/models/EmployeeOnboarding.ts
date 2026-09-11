import mongoose, { Document, Schema, Types } from 'mongoose';

export type OnboardingStatus =
  | 'pending_documents'
  | 'submitted'
  | 'hr_review'
  | 'approved'
  | 'rejected';

export interface IEmployeeOnboarding extends Document {
  employee: Types.ObjectId;
  status: OnboardingStatus;
  proposedMonthlySalary: number;
  approvedMonthlySalary?: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  panNumber?: string;
  employeeNotes?: string;
  hrNotes?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  sharedWithAdmin: boolean;
  sharedWithAdminAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeOnboardingSchema = new Schema<IEmployeeOnboarding>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending_documents', 'submitted', 'hr_review', 'approved', 'rejected'],
      default: 'pending_documents',
      index: true,
    },
    proposedMonthlySalary: { type: Number, default: 0, min: 0 },
    approvedMonthlySalary: { type: Number, min: 0 },
    bankAccountNumber: { type: String, default: '', trim: true },
    bankIfsc: { type: String, default: '', trim: true },
    bankName: { type: String, default: '', trim: true },
    panNumber: { type: String, default: '', trim: true },
    employeeNotes: { type: String, default: '', trim: true },
    hrNotes: { type: String, default: '', trim: true },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sharedWithAdmin: { type: Boolean, default: false, index: true },
    sharedWithAdminAt: { type: Date },
  },
  { timestamps: true },
);

export const EmployeeOnboarding = mongoose.model<IEmployeeOnboarding>(
  'EmployeeOnboarding',
  employeeOnboardingSchema,
);
