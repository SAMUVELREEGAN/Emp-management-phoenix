import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import {
  getOfficeHours,
  updateOfficeHours,
} from '../services/officeSettingsService';

export const getOfficeSettings = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const officeHours = await getOfficeHours();
    return sendSuccess(res, 'Office hours fetched successfully', { officeHours });
  },
);

export const updateOfficeSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const officeHours = await updateOfficeHours(
      req.user!._id.toString(),
      req.body,
    );
    return sendSuccess(res, 'Office hours updated successfully', { officeHours });
  },
);
