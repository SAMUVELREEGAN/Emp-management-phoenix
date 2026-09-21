import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';

export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user!._id }),
      Notification.countDocuments({
        recipient: req.user!._id,
        isRead: false,
      }),
    ]);

    return sendSuccess(res, 'Notifications fetched successfully', {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  },
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user!._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return sendSuccess(res, 'Notification marked as read', { notification });
  },
);

export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await Notification.updateMany(
      { recipient: req.user!._id, isRead: false },
      { isRead: true },
    );
    return sendSuccess(res, 'All notifications marked as read');
  },
);

export const deleteAllNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await Notification.deleteMany({ recipient: req.user!._id });
    return sendSuccess(res, 'All notifications deleted');
  },
);
