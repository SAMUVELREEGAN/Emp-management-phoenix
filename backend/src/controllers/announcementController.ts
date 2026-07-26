import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { sendAnnouncement } from '../services/announcementService';
import { AnnouncementAudience } from '../types';

export const createAnnouncement = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { title, message, audience } = req.body as {
      title: string;
      message: string;
      audience: AnnouncementAudience;
    };

    const result = await sendAnnouncement({ title, message, audience });

    return sendSuccess(res, 'Announcement sent successfully', result);
  },
);
