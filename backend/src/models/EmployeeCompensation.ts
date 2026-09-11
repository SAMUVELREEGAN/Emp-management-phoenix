import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmployeeCompensation extends Document {
  employee: Types.ObjectId;
  monthlySalary: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  setBy: Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeCompensationSchema = new Schema<IEmployeeCompensation>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    setBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

employeeCompensationSchema.index({ employee: 1, isActive: 1, effectiveFrom: -1 });

export const EmployeeCompensation = mongoose.model<IEmployeeCompensation>(
  'EmployeeCompensation',
  employeeCompensationSchema,
);
