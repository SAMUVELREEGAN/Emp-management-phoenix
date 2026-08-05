import mongoose from 'mongoose';
import { env } from '../config/env';
import { OfficeSettings, type IOfficeSettings } from '../models/OfficeSettings';
import { ApiError } from '../utils/ApiError';
import { parseTimeToMinutes } from '../utils/dateHelpers';

export interface OfficeSettingsData {
  officeStartTime: string;
  officeEndTime: string;
  geofenceEnabled: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters: number;
  officeLocationName?: string;
}

export type OfficeSettingsUpdate = Partial<OfficeSettingsData>;

/** @deprecated Use OfficeSettingsData */
export type OfficeHours = OfficeSettingsData;

let cachedOfficeSettings: OfficeSettingsData | null = null;

export const clearOfficeHoursCache = () => {
  cachedOfficeSettings = null;
};

function mapSettings(settings: {
  officeStartTime: string;
  officeEndTime: string;
  geofenceEnabled?: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters?: number;
  officeLocationName?: string;
}): OfficeSettingsData {
  return {
    officeStartTime: settings.officeStartTime,
    officeEndTime: settings.officeEndTime,
    geofenceEnabled: settings.geofenceEnabled ?? false,
    officeLatitude: settings.officeLatitude,
    officeLongitude: settings.officeLongitude,
    geofenceRadiusMeters: settings.geofenceRadiusMeters ?? 200,
    officeLocationName: settings.officeLocationName ?? '',
  };
}

/** Keep a single settings row so reads and writes always target the same document. */
async function resolveOfficeSettingsDocument(
  createIfMissing = true,
): Promise<IOfficeSettings | null> {
  const documents = await OfficeSettings.find().sort({ updatedAt: -1 });

  if (documents.length === 0) {
    if (!createIfMissing) {
      return null;
    }

    return OfficeSettings.create({
      officeStartTime: env.OFFICE_START_TIME,
      officeEndTime: env.OFFICE_END_TIME,
      geofenceEnabled: false,
      geofenceRadiusMeters: 200,
    });
  }

  const [primary, ...duplicates] = documents;

  if (duplicates.length > 0) {
    await OfficeSettings.deleteMany({
      _id: { $in: duplicates.map(doc => doc._id) },
    });
    clearOfficeHoursCache();
  }

  return primary;
}

export const ensureOfficeSettingsDocument = async (): Promise<void> => {
  await resolveOfficeSettingsDocument(true);
};

export const getOfficeHours = async (): Promise<OfficeSettingsData> => {
  if (cachedOfficeSettings) {
    return cachedOfficeSettings;
  }

  const settings = await resolveOfficeSettingsDocument(true);
  cachedOfficeSettings = mapSettings(settings!);
  return cachedOfficeSettings;
};

export const updateOfficeHours = async (
  adminId: string,
  patch: OfficeSettingsUpdate,
): Promise<OfficeSettingsData> => {
  let settings = await resolveOfficeSettingsDocument(true);

  if (!settings) {
    settings = await OfficeSettings.create({
      officeStartTime: env.OFFICE_START_TIME,
      officeEndTime: env.OFFICE_END_TIME,
      geofenceEnabled: false,
      geofenceRadiusMeters: 200,
      updatedBy: adminId,
    });
  }

  const current = mapSettings(settings);

  const merged: OfficeSettingsData = {
    officeStartTime: patch.officeStartTime ?? current.officeStartTime,
    officeEndTime: patch.officeEndTime ?? current.officeEndTime,
    geofenceEnabled:
      patch.geofenceEnabled !== undefined
        ? patch.geofenceEnabled
        : current.geofenceEnabled,
    officeLatitude:
      patch.officeLatitude !== undefined
        ? patch.officeLatitude
        : current.officeLatitude,
    officeLongitude:
      patch.officeLongitude !== undefined
        ? patch.officeLongitude
        : current.officeLongitude,
    geofenceRadiusMeters:
      patch.geofenceRadiusMeters ?? current.geofenceRadiusMeters,
    officeLocationName:
      patch.officeLocationName !== undefined
        ? patch.officeLocationName
        : current.officeLocationName ?? '',
  };

  if (
    parseTimeToMinutes(merged.officeStartTime) >=
    parseTimeToMinutes(merged.officeEndTime)
  ) {
    throw ApiError.badRequest('Office start time must be before office end time');
  }

  if (
    merged.geofenceEnabled &&
    (merged.officeLatitude == null || merged.officeLongitude == null)
  ) {
    throw ApiError.badRequest(
      'Office latitude and longitude are required when geofencing is enabled',
    );
  }

  settings.officeStartTime = merged.officeStartTime;
  settings.officeEndTime = merged.officeEndTime;
  settings.geofenceEnabled = merged.geofenceEnabled;
  settings.officeLatitude = merged.officeLatitude;
  settings.officeLongitude = merged.officeLongitude;
  settings.geofenceRadiusMeters = merged.geofenceRadiusMeters;
  settings.officeLocationName = merged.officeLocationName ?? '';
  settings.updatedBy = new mongoose.Types.ObjectId(adminId);
  await settings.save();

  cachedOfficeSettings = mapSettings(settings);
  return cachedOfficeSettings;
};
