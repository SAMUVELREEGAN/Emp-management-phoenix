import { FilterQuery, Types } from 'mongoose';
import { User, IUser } from '../models/User';
import { Notification } from '../models/Notification';
import { VerificationCode } from '../models/VerificationCode';
import { Attendance } from '../models/Attendance';
import { WorkReport } from '../models/WorkReport';
import { Task } from '../models/Task';
import { LeaveRequest } from '../models/LeaveRequest';
import { RouteSession } from '../models/RouteSession';
import { RoutePoint } from '../models/RoutePoint';
import { ApiError } from '../utils/ApiError';
import { parseDateOnly } from '../utils/dateHelpers';
import { phoneLookupKey } from '../utils/phoneHelpers';
import { UserRole, UserStatus } from '../types';
import { createNotification } from './notificationService';

interface EmployeeFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  role?: 'employee' | 'hr';
  requesterRole?: UserRole;
}

interface CreateEmployeeInput {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  joiningDate: string;
  address?: string;
  role?: UserRole;
  status?: UserStatus;
}

export const listEmployees = async (filters: EmployeeFilters) => {
  const listRole = filters.requesterRole === 'hr' ? 'employee' : filters.role || 'employee';
  const query: FilterQuery<IUser> = { role: listRole };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { fullName: regex },
      { email: regex },
      { employeeId: regex },
      { department: regex },
      { phone: regex },
    ];
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
    User.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit) || 1,
    },
  };
};

export const getEmployeeById = async (id: string, requesterRole?: UserRole) => {
  const employee = await User.findById(id);
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  if (requesterRole === 'hr' && employee.role !== 'employee') {
    throw ApiError.forbidden('HR can only view employee records');
  }

  return employee;
};

export const createEmployee = async (
  data: CreateEmployeeInput,
  profilePhoto?: string,
  _adminId?: string,
) => {
  const existingEmail = await User.findOne({
    email: data.email.toLowerCase(),
  });
  if (existingEmail) {
    throw ApiError.conflict('Email already exists');
  }

  const existingEmpId = await User.findOne({
    employeeId: data.employeeId.toUpperCase(),
  });
  if (existingEmpId) {
    throw ApiError.conflict('Employee ID already exists');
  }

  const phoneNormalized = phoneLookupKey(data.phone);
  const existingPhone = await User.findOne({ phoneNormalized });
  if (existingPhone) {
    throw ApiError.conflict('Phone number already exists');
  }

  const employee = await User.create({
    employeeId: data.employeeId.toUpperCase(),
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    phone: data.phone,
    phoneNormalized,
    password: data.password,
    department: data.department,
    designation: data.designation,
    joiningDate: parseDateOnly(data.joiningDate),
    address: data.address || '',
    profilePhoto: profilePhoto || '',
    role: data.role || 'employee',
    status: data.status || 'active',
    isVerified: true,
  });

  await createNotification({
    recipient: employee._id,
    title: 'Welcome aboard',
    message:
      employee.role === 'hr'
        ? 'Your HR account has been created. Log in with your email or mobile number and the password set by admin.'
        : 'Your employee account has been created. Log in with your email or mobile number and the password set by admin.',
    type: 'employee',
    relatedId: employee._id,
  });

  return employee;
};

export const updateEmployee = async (
  id: string,
  data: Partial<CreateEmployeeInput>,
  profilePhoto?: string,
) => {
  const employee = await User.findById(id).select('+password');
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  if (data.email && data.email.toLowerCase() !== employee.email) {
    const exists = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (exists) {
      throw ApiError.conflict('Email already exists');
    }
    employee.email = data.email.toLowerCase();
  }

  if (
    data.employeeId &&
    data.employeeId.toUpperCase() !== employee.employeeId
  ) {
    const exists = await User.findOne({
      employeeId: data.employeeId.toUpperCase(),
      _id: { $ne: id },
    });
    if (exists) {
      throw ApiError.conflict('Employee ID already exists');
    }
    employee.employeeId = data.employeeId.toUpperCase();
  }

  if (data.fullName !== undefined) employee.fullName = data.fullName;
  if (data.phone !== undefined) {
    const phoneNormalized = phoneLookupKey(data.phone);
    const exists = await User.findOne({
      phoneNormalized,
      _id: { $ne: id },
    });
    if (exists) {
      throw ApiError.conflict('Phone number already exists');
    }
    employee.phone = data.phone;
    employee.phoneNormalized = phoneNormalized;
  }
  if (data.department !== undefined) employee.department = data.department;
  if (data.designation !== undefined) employee.designation = data.designation;
  if (data.address !== undefined) employee.address = data.address;
  if (data.role !== undefined) employee.role = data.role;
  if (data.status !== undefined) employee.status = data.status;
  if (data.joiningDate) {
    employee.joiningDate = parseDateOnly(data.joiningDate);
  }
  if (data.password) {
    employee.password = data.password;
  }
  if (profilePhoto) {
    employee.profilePhoto = profilePhoto;
  }

  await employee.save();
  return employee;
};

export const updateEmployeeStatus = async (
  id: string,
  status: 'active' | 'inactive',
) => {
  const employee = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  await createNotification({
    recipient: employee._id,
    title: 'Account status updated',
    message: `Your account has been marked as ${status}.`,
    type: 'employee',
    relatedId: employee._id,
  });

  return employee;
};

export const deleteEmployee = async (id: string, requesterId: string) => {
  if (id === requesterId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const employee = await User.findById(id);
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  if (employee.role === 'admin') {
    throw ApiError.forbidden('Admin accounts cannot be deleted');
  }

  if (employee.role !== 'employee' && employee.role !== 'hr') {
    throw ApiError.badRequest('Only employee or HR accounts can be deleted');
  }

  const userId = employee._id as Types.ObjectId;

  const sessions = await RouteSession.find({ employee: userId }).select('_id');
  const sessionIds = sessions.map(session => session._id);

  await Promise.all([
    Notification.deleteMany({ recipient: userId }),
    VerificationCode.deleteMany({ user: userId }),
    Attendance.deleteMany({ employee: userId }),
    WorkReport.deleteMany({ employee: userId }),
    Task.deleteMany({ $or: [{ assignedTo: userId }, { assignedBy: userId }] }),
    LeaveRequest.deleteMany({ $or: [{ employee: userId }, { reviewedBy: userId }] }),
    sessionIds.length
      ? RoutePoint.deleteMany({ session: { $in: sessionIds } })
      : Promise.resolve(),
    RouteSession.deleteMany({ employee: userId }),
  ]);

  await User.findByIdAndDelete(id);

  return { role: employee.role };
};
