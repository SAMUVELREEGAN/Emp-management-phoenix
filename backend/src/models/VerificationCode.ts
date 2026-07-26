import mongoose, { Document, Schema, Types } from 'mongoose';

export type VerificationChannel = 'email' | 'sms';

export interface IVerificationCode extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  codeHash: string;
  channel: VerificationChannel;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

verificationCodeSchema.index({ user: 1, channel: 1 });

export const VerificationCode = mongoose.model<IVerificationCode>(
  'VerificationCode',
  verificationCodeSchema,
);
