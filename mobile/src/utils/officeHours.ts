import type { OfficeHours } from '../types';

const DEFAULT_OFFICE_HOURS: OfficeHours = {
  officeStartTime: '09:30',
  officeEndTime: '18:00',
  geofenceEnabled: false,
  geofenceRadiusMeters: 200,
  officeLocationName: 'Office',
};

export function normalizeOfficeHours(
  raw?: Partial<OfficeHours> | null,
): OfficeHours {
  if (!raw) {
    return { ...DEFAULT_OFFICE_HOURS };
  }

  const latitude =
    raw.officeLatitude != null && !Number.isNaN(Number(raw.officeLatitude))
      ? Number(raw.officeLatitude)
      : undefined;
  const longitude =
    raw.officeLongitude != null && !Number.isNaN(Number(raw.officeLongitude))
      ? Number(raw.officeLongitude)
      : undefined;

  return {
    officeStartTime: raw.officeStartTime ?? DEFAULT_OFFICE_HOURS.officeStartTime,
    officeEndTime: raw.officeEndTime ?? DEFAULT_OFFICE_HOURS.officeEndTime,
    geofenceEnabled: raw.geofenceEnabled === true,
    officeLatitude: latitude,
    officeLongitude: longitude,
    geofenceRadiusMeters: raw.geofenceRadiusMeters ?? 200,
    officeLocationName: raw.officeLocationName?.trim() || 'Office',
  };
}

export { DEFAULT_OFFICE_HOURS };
