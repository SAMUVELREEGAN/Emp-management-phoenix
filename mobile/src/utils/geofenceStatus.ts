import type { OfficeHours } from '../types';
import { distanceMeters, formatDistanceMeters } from './geofence';

export interface GeofenceStatus {
  enforced: boolean;
  within: boolean | null;
  distanceMeters?: number;
  officeName: string;
  radiusMeters: number;
}

export function getGeofenceStatus(
  latitude: number,
  longitude: number,
  officeHours: OfficeHours,
): GeofenceStatus {
  const officeName = officeHours.officeLocationName?.trim() || 'Office';
  const radiusMeters = officeHours.geofenceRadiusMeters ?? 200;

  if (
    !officeHours.geofenceEnabled ||
    officeHours.officeLatitude == null ||
    officeHours.officeLongitude == null
  ) {
    return {
      enforced: false,
      within: null,
      officeName,
      radiusMeters,
    };
  }

  const distance = distanceMeters(
    latitude,
    longitude,
    officeHours.officeLatitude,
    officeHours.officeLongitude,
  );

  return {
    enforced: true,
    within: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
    officeName,
    radiusMeters,
  };
}

export function buildOutsideGeofenceMessage(
  status: GeofenceStatus,
  currentAddress: string,
  action: 'check-in' | 'check-out',
): string {
  const distanceLabel = formatDistanceMeters(status.distanceMeters ?? 0);
  const actionLabel = action === 'check-in' ? 'Check-in' : 'Check-out';

  return `You are outside the ${status.officeName} area (${distanceLabel} away from the allowed ${status.radiusMeters} m radius).\n\n${actionLabel} is only allowed inside the office geofence.\n\nYour current location:\n${currentAddress}`;
}

export function buildInsideGeofenceMessage(status: GeofenceStatus, currentAddress: string): string {
  return `You are inside the ${status.officeName} area.\n\nYour current location:\n${currentAddress}`;
}
