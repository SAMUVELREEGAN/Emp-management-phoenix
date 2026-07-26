import { UserRole } from '../types';
import { IUser } from '../models/User';
import { User } from '../models/User';

export const MANAGEMENT_ROLES: UserRole[] = ['admin', 'hr'];

export const requiresAccountVerification = (user: Pick<IUser, 'role' | 'isVerified'>): boolean =>
  (user.role === 'employee' || user.role === 'hr') && user.isVerified === false;

export const canManageEmployees = (role: UserRole): boolean => role === 'admin';

export const canViewEmployeeDirectory = (role: UserRole): boolean =>
  role === 'admin' || role === 'hr';

export const findActiveManagers = () =>
  User.find({ role: { $in: MANAGEMENT_ROLES }, status: 'active' }).select('_id');

export const findActiveAdmins = () =>
  User.find({ role: 'admin', status: 'active' }).select('_id fullName');
