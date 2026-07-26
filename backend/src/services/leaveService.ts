import { FilterQuery, Types } from 'mongoose';
import { LeaveRequest, ILeaveRequest } from '../models/LeaveRequest';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  calculateLeaveDuration,
  endOfDay,
  parseDateOnly,
  startOfDay,
} from '../utils/dateHelpers';
import { createNotification } from './notificationService';
import { findActiveManagers } from '../utils/roleHelpers';

interface ListFilters {
  page: number;
  limit: number;
  status?: string;
  employeeId?: string;
}

interface CreateLeaveInput {
  leaveType: 'full_day' | 'half_day';
  fromDate: string;
  toDate: string;
  halfDayHours?: number;
  reason: string;
}

const userPopulateFields = 'fullName employeeId department designation role';

export const createLeaveRequest = async (
  employeeId: string,
  data: CreateLeaveInput,
) => {
  const fromDate = parseDateOnly(data.fromDate);
  const toDate = parseDateOnly(data.toDate);

  if (fromDate.getTime() > toDate.getTime()) {
    throw ApiError.badRequest('From date must be on or before to date');
  }

  if (data.leaveType === 'half_day') {
    if (data.fromDate !== data.toDate) {
      throw ApiError.badRequest('Half day leave must use the same from and to date');
    }
    if (!data.halfDayHours || data.halfDayHours < 1 || data.halfDayHours > 8) {
      throw ApiError.badRequest('Half day leave requires hours between 1 and 8');
    }
  }

  const { totalDays } = calculateLeaveDuration(
    data.leaveType,
    data.fromDate,
    data.toDate,
    data.halfDayHours,
  );

  const overlapping = await LeaveRequest.findOne({
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    fromDate: { $lte: endOfDay(toDate) },
    toDate: { $gte: startOfDay(fromDate) },
  });

  if (overlapping) {
    throw ApiError.conflict('You already have a leave request for overlapping dates');
  }

  const leave = await LeaveRequest.create({
    employee: employeeId,
    leaveType: data.leaveType,
    fromDate,
    toDate,
    halfDayHours: data.leaveType === 'half_day' ? data.halfDayHours : undefined,
    totalDays,
    reason: data.reason.trim(),
    status: 'pending',
  });

  const managers = await findActiveManagers();
  await Promise.all(
    managers.map((manager) =>
      createNotification({
        recipient: manager._id,
        title: 'New leave request',
        message: `A leave request is awaiting approval (${data.leaveType === 'half_day' ? `${data.halfDayHours}h half day` : `${totalDays} day(s)`}).`,
        type: 'leave',
        relatedId: leave._id,
      }),
    ),
  );

  return LeaveRequest.findById(leave._id).populate('employee', userPopulateFields);
};

export const listLeaveRequests = async (filters: ListFilters) => {
  const query: FilterQuery<ILeaveRequest> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.employeeId) {
    query.employee = new Types.ObjectId(filters.employeeId);
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('employee', userPopulateFields)
      .populate('reviewedBy', 'fullName'),
    LeaveRequest.countDocuments(query),
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

export const getMyLeaveRequests = async (
  employeeId: string,
  filters: ListFilters,
) => listLeaveRequests({ ...filters, employeeId });

export const getLeaveById = async (id: string, userId: string, role: string) => {
  const leave = await LeaveRequest.findById(id)
    .populate('employee', userPopulateFields)
    .populate('reviewedBy', 'fullName');

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  const isOwner = leave.employee._id.toString() === userId;
  const isManager = role === 'admin' || role === 'hr';

  if (!isOwner && !isManager) {
    throw ApiError.forbidden('You do not have access to this leave request');
  }

  return leave;
};

export const cancelLeaveRequest = async (id: string, employeeId: string) => {
  const leave = await LeaveRequest.findById(id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.employee.toString() !== employeeId) {
    throw ApiError.forbidden('You can only cancel your own leave requests');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Only pending leave requests can be cancelled');
  }

  leave.status = 'cancelled';
  await leave.save();

  return LeaveRequest.findById(leave._id)
    .populate('employee', userPopulateFields)
    .populate('reviewedBy', 'fullName');
};

export const reviewLeaveRequest = async (
  id: string,
  reviewerId: string,
  status: 'approved' | 'rejected',
  adminComment = '',
) => {
  const leave = await LeaveRequest.findById(id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Only pending leave requests can be reviewed');
  }

  leave.status = status;
  leave.adminComment = adminComment.trim();
  leave.reviewedBy = new Types.ObjectId(reviewerId);
  leave.reviewedAt = new Date();
  await leave.save();

  await createNotification({
    recipient: leave.employee,
    title: `Leave request ${status}`,
    message: adminComment
      ? `Your leave request was ${status}. Comment: ${adminComment}`
      : `Your leave request was ${status}.`,
    type: 'leave',
    relatedId: leave._id,
  });

  return LeaveRequest.findById(leave._id)
    .populate('employee', userPopulateFields)
    .populate('reviewedBy', 'fullName');
};

export const previewLeaveDuration = (data: CreateLeaveInput) =>
  calculateLeaveDuration(
    data.leaveType,
    data.fromDate,
    data.toDate,
    data.halfDayHours,
  );

export const getLeaveStats = async () => {
  const pending = await LeaveRequest.countDocuments({ status: 'pending' });
  return { pending };
};
