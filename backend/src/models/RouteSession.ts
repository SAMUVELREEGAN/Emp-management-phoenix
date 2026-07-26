import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRouteSession extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  attendance: Types.ObjectId;
  date: Date;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  lastLatitude?: number;
  lastLongitude?: number;
  lastAddress?: string;
  lastRecordedAt?: Date;
  pointCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const routeSessionSchema = new Schema<IRouteSession>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendance: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
    },
    lastLatitude: { type: Number },
    lastLongitude: { type: Number },
    lastAddress: { type: String, default: '' },
    lastRecordedAt: { type: Date },
    pointCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

routeSessionSchema.index({ employee: 1, date: -1 });
routeSessionSchema.index({ isActive: 1, lastRecordedAt: -1 });

export const RouteSession = mongoose.model<IRouteSession>(
  'RouteSession',
  routeSessionSchema,
);
