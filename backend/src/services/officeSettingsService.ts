import mongoose from 'mongoose';
import { env } from '../config/env';
import { OfficeSettings } from '../models/OfficeSettings';

export interface OfficeHours {
  officeStartTime: string;
  officeEndTime: string;
}

let cachedOfficeHours: OfficeHours | null = null;

export const clearOfficeHoursCache = () => {
  cachedOfficeHours = null;
};

export const getOfficeHours = async (): Promise<OfficeHours> => {
  if (cachedOfficeHours) {
    return cachedOfficeHours;
  }

  let settings = await OfficeSettings.findOne().sort({ updatedAt: -1 });

  if (!settings) {
    settings = await OfficeSettings.create({
      officeStartTime: env.OFFICE_START_TIME,
      officeEndTime: env.OFFICE_END_TIME,
    });
  }

  cachedOfficeHours = {
    officeStartTime: settings.officeStartTime,
    officeEndTime: settings.officeEndTime,
  };

  return cachedOfficeHours;
};

export const updateOfficeHours = async (
  adminId: string,
  data: OfficeHours,
): Promise<OfficeHours> => {
  let settings = await OfficeSettings.findOne();

  if (!settings) {
    settings = await OfficeSettings.create({
      officeStartTime: data.officeStartTime,
      officeEndTime: data.officeEndTime,
      updatedBy: adminId,
    });
  } else {
    settings.officeStartTime = data.officeStartTime;
    settings.officeEndTime = data.officeEndTime;
    settings.updatedBy = new mongoose.Types.ObjectId(adminId);
    await settings.save();
  }

  cachedOfficeHours = {
    officeStartTime: settings.officeStartTime,
    officeEndTime: settings.officeEndTime,
  };

  return cachedOfficeHours;
};
