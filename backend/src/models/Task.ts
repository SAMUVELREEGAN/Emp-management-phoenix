import mongoose, { Document, Schema, Types } from 'mongoose';

export type TaskStatus = 'assigned' | 'submitted';
export type TaskCompletionStatus = 'completed' | 'partial';

export interface ITask extends Document {
  _id: Types.ObjectId;
  assignedTo: Types.ObjectId;
  assignedBy: Types.ObjectId;
  title: string;
  description: string;
  dueDate?: Date;
  status: TaskStatus;
  completionStatus?: TaskCompletionStatus;
  employeeRemark?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['assigned', 'submitted'],
      default: 'assigned',
    },
    completionStatus: {
      type: String,
      enum: ['completed', 'partial'],
    },
    employeeRemark: {
      type: String,
      default: '',
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
