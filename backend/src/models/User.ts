import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../types';
import { phoneLookupKey } from '../utils/phoneHelpers';

export interface IUser extends Document {
  _id: Types.ObjectId;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  joiningDate: Date;
  profilePhoto?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  phoneNormalized: string;
  isFieldEmployee: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'hr'],
      default: 'employee',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFieldEmployee: {
      type: Boolean,
      default: false,
    },
    phoneNormalized: {
      type: String,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ fullName: 'text', email: 'text', employeeId: 'text' });
userSchema.index({ phoneNormalized: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function prepareUser() {
  if (this.isModified('phone')) {
    this.phoneNormalized = phoneLookupKey(this.phone);
  }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);
