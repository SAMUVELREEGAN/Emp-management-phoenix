import { LocationPayload } from '../types';

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(
  from: Pick<LocationPayload, 'latitude' | 'longitude'>,
  to: Pick<LocationPayload, 'latitude' | 'longitude'>,
): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export interface GeofenceConfig {
  geofenceEnabled: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  geofenceRadiusMeters: number;
}

export interface GeofenceEvaluation {
  enforced: boolean;
  within: boolean;
  distanceMeters?: number;
}

export function evaluateGeofence(
  location: LocationPayload,
  config: GeofenceConfig,
): GeofenceEvaluation {
  if (
    !config.geofenceEnabled ||
    config.officeLatitude == null ||
    config.officeLongitude == null
  ) {
    return { enforced: false, within: true };
  }

  const distance = distanceMeters(location, {
    latitude: config.officeLatitude,
    longitude: config.officeLongitude,
  });

  return {
    enforced: true,
    within: distance <= config.geofenceRadiusMeters,
    distanceMeters: Math.round(distance),
  };
}

export function formatDistanceMeters(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}
