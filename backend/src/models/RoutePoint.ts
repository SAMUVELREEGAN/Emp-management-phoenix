import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoutePoint extends Document {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  latitude: number;
  longitude: number;
  address?: string;
  recordedAt: Date;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const routePointSchema = new Schema<IRoutePoint>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'RouteSession',
      required: true,
      index: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
    recordedAt: { type: Date, required: true },
    sequence: { type: Number, required: true },
  },
  { timestamps: true },
);

routePointSchema.index({ session: 1, sequence: 1 });

export const RoutePoint = mongoose.model<IRoutePoint>('RoutePoint', routePointSchema);
