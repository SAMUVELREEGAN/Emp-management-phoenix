import type { OfficeHours } from '../types';

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const deltaLat = ((toLat - fromLat) * Math.PI) / 180;
  const deltaLon = ((toLon - fromLon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function isWithinOfficeGeofence(
  latitude: number,
  longitude: number,
  officeHours: OfficeHours,
): boolean | null {
  if (
    !officeHours.geofenceEnabled ||
    officeHours.officeLatitude == null ||
    officeHours.officeLongitude == null
  ) {
    return null;
  }

  const distance = distanceMeters(
    latitude,
    longitude,
    officeHours.officeLatitude,
    officeHours.officeLongitude,
  );

  return distance <= (officeHours.geofenceRadiusMeters ?? 200);
}

export function formatDistanceMeters(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}
