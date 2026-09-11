import mongoose, { Document, Schema, Types } from 'mongoose';

export type OnboardingDocumentCategory =
  | 'id_proof'
  | 'address_proof'
  | 'bank_proof'
  | 'education'
  | 'other';

export type OnboardingDocumentStatus = 'pending' | 'approved' | 'rejected';

export interface IOnboardingDocument extends Document {
  employee: Types.ObjectId;
  category: OnboardingDocumentCategory;
  title: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  status: OnboardingDocumentStatus;
  reviewedBy?: Types.ObjectId;
  reviewComment?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const onboardingDocumentSchema = new Schema<IOnboardingDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['id_proof', 'address_proof', 'bank_proof', 'education', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewComment: { type: String, default: '', trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

export const OnboardingDocument = mongoose.model<IOnboardingDocument>(
  'OnboardingDocument',
  onboardingDocumentSchema,
);
