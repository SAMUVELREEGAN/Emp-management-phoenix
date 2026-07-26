import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOfficeSettings extends Document {
  _id: Types.ObjectId;
  officeStartTime: string;
  officeEndTime: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const officeSettingsSchema = new Schema<IOfficeSettings>(
  {
    officeStartTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
      default: '09:30',
    },
    officeEndTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
      default: '18:00',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export const OfficeSettings = mongoose.model<IOfficeSettings>(
  'OfficeSettings',
  officeSettingsSchema,
);
