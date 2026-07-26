import { FilterQuery, Types } from 'mongoose';
import { Task, ITask } from '../models/Task';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { parseDateOnly } from '../utils/dateHelpers';
import { createNotification } from './notificationService';

interface ListFilters {
  page: number;
  limit: number;
  status?: string;
  employeeId?: string;
  search?: string;
}

interface AssignTaskInput {
  assignedTo: string;
  title: string;
  description: string;
  dueDate?: string;
}

interface SubmitTaskInput {
  completionStatus: 'completed' | 'partial';
  employeeRemark: string;
}

const userPopulateFields = 'fullName employeeId department designation role';

export const assignTask = async (adminId: string, data: AssignTaskInput) => {
  const employee = await User.findOne({
    _id: data.assignedTo,
    role: 'employee',
    status: 'active',
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found or inactive');
  }

  const task = await Task.create({
    assignedTo: employee._id,
    assignedBy: adminId,
    title: data.title.trim(),
    description: data.description.trim(),
    dueDate: data.dueDate ? parseDateOnly(data.dueDate) : undefined,
    status: 'assigned',
  });

  await createNotification({
    recipient: employee._id,
    title: 'New task assigned',
    message: `You have been assigned: "${task.title}"`,
    type: 'task',
    relatedId: task._id,
  });

  return Task.findById(task._id)
    .populate('assignedTo', userPopulateFields)
    .populate('assignedBy', userPopulateFields);
};

export const listTasks = async (filters: ListFilters) => {
  const query: FilterQuery<ITask> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.employeeId) {
    query.assignedTo = new Types.ObjectId(filters.employeeId);
  }

  const skip = (filters.page - 1) * filters.limit;

  let items = await Task.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(filters.limit)
    .populate('assignedTo', userPopulateFields)
    .populate('assignedBy', userPopulateFields);

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    items = items.filter(
      (item) =>
        regex.test(item.title) ||
        regex.test(item.description) ||
        regex.test(
          (item.assignedTo as unknown as { fullName?: string })?.fullName || '',
        ),
    );
  }

  const total = await Task.countDocuments(query);

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

export const getMyTasks = async (employeeId: string, filters: ListFilters) => {
  return listTasks({ ...filters, employeeId });
};

export const getTaskById = async (id: string, userId: string, role: string) => {
  const task = await Task.findById(id)
    .populate('assignedTo', userPopulateFields)
    .populate('assignedBy', userPopulateFields);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const isAssignee = task.assignedTo._id.toString() === userId;
  const isAdmin = role === 'admin';

  if (!isAssignee && !isAdmin) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  return task;
};

export const submitTask = async (
  id: string,
  employeeId: string,
  data: SubmitTaskInput,
) => {
  const task = await Task.findById(id).populate('assignedBy', userPopulateFields);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (task.assignedTo.toString() !== employeeId) {
    throw ApiError.forbidden('You can only submit your own tasks');
  }

  if (task.status === 'submitted') {
    throw ApiError.badRequest('Task has already been submitted');
  }

  task.status = 'submitted';
  task.completionStatus = data.completionStatus;
  task.employeeRemark = data.employeeRemark.trim();
  task.submittedAt = new Date();
  await task.save();

  const assigner = task.assignedBy as unknown as { _id: Types.ObjectId };
  await createNotification({
    recipient: assigner._id,
    title: 'Task submitted',
    message: `Task "${task.title}" was marked as ${data.completionStatus}.`,
    type: 'task',
    relatedId: task._id,
  });

  return Task.findById(task._id)
    .populate('assignedTo', userPopulateFields)
    .populate('assignedBy', userPopulateFields);
};

export const getTaskStats = async () => {
  const [assigned, submitted] = await Promise.all([
    Task.countDocuments({ status: 'assigned' }),
    Task.countDocuments({ status: 'submitted' }),
  ]);

  return { assigned, submitted };
};
