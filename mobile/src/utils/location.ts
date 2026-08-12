import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { PositionError, type GeoPosition } from 'react-native-geolocation-service';
import type { GeoOptions } from 'react-native-geolocation-service';
import { geocodeApi } from '../api/geocodeApi';
import type { Attendance, LocationPayload } from '../types';

const ATTENDANCE_LOCATION_ATTEMPTS: GeoOptions[] = [
  {
    enableHighAccuracy: true,
    timeout: 35000,
    maximumAge: 0,
    showLocationDialog: true,
    forceRequestLocation: true,
    accuracy: { android: 'high', ios: 'best' },
  },
  {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 60000,
    showLocationDialog: true,
    forceRequestLocation: false,
    accuracy: { android: 'high', ios: 'best' },
  },
  {
    enableHighAccuracy: false,
    timeout: 20000,
    maximumAge: 120000,
    showLocationDialog: true,
    forceRequestLocation: false,
  },
];

const LOCATION_ATTEMPTS: GeoOptions[] = [
  {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 300000,
    showLocationDialog: true,
    forceRequestLocation: false,
    accuracy: { android: 'balanced', ios: 'hundredMeters' },
  },
  {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 120000,
    showLocationDialog: true,
    forceRequestLocation: false,
    accuracy: { android: 'high', ios: 'best' },
  },
];

let locationLock: Promise<void> = Promise.resolve();
let attendanceLocationBusy = false;

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value.trim());
}

function shouldRefreshPlaceName(address?: string): boolean {
  if (!address?.trim() || looksLikeCoordinates(address)) {
    return true;
  }

  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  // Re-fetch generic town/city labels like "Manamadurai, Tamil Nadu, India".
  if (parts.length <= 3) {
    return true;
  }

  return false;
}

function toLocationPayload(position: GeoPosition): LocationPayload {
  const accuracy = position.coords.accuracy;
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy:
      accuracy != null && Number.isFinite(accuracy) && accuracy > 0
        ? Math.round(accuracy)
        : undefined,
  };
}

function getLocationErrorMessage(error: { code: number; message: string }): string {
  switch (error.code) {
    case PositionError.PERMISSION_DENIED:
      return 'Location permission is denied. Enable it in app settings and try again.';
    case PositionError.POSITION_UNAVAILABLE:
      return 'Location is unavailable. Turn on GPS/location services and try again.';
    case PositionError.TIMEOUT:
      return 'Could not detect your location in time. Move near a window or outdoors and try again.';
    case PositionError.PLAY_SERVICE_NOT_AVAILABLE:
      return 'Google Play location services are unavailable on this device.';
    case PositionError.SETTINGS_NOT_SATISFIED:
      return 'Location services are turned off. Enable GPS in your phone settings and try again.';
    default:
      return error.message || 'Unable to get your current location.';
  }
}

function getCurrentPosition(options: GeoOptions): Promise<LocationPayload> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(toLocationPayload(position)),
      error => reject(new Error(getLocationErrorMessage(error))),
      options,
    );
  });
}

async function withLocationLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = locationLock;
  let release = () => {};
  locationLock = new Promise<void>(resolve => {
    release = resolve;
  });
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

export function isAttendanceLocationBusy(): boolean {
  return attendanceLocationBusy;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineGranted =
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted =
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;

    return fineGranted || coarseGranted;
  }

  const status = await Geolocation.requestAuthorization('whenInUse');
  return status === 'granted';
}

async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return;
  }

  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}

export async function requestBackgroundLocationPermission(options?: {
  showDeniedAlert?: boolean;
}): Promise<boolean> {
  const showDeniedAlert = options?.showDeniedAlert ?? true;
  const foregroundGranted = await requestLocationPermission();
  if (!foregroundGranted) {
    if (showDeniedAlert) {
      Alert.alert(
        'Location required',
        'Location permission is required to record your route while checked in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
    return false;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  await requestNotificationPermission();

  if (Platform.Version < 29) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
  );
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
  );

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  if (showDeniedAlert) {
    Alert.alert(
      'Background location needed',
      'To keep recording your route when the app is in the background, allow location access "All the time" in app settings.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
  }

  return false;
}

function watchBestPosition(
  options: GeoOptions,
  maxWaitMs: number,
  targetAccuracyM: number,
): Promise<LocationPayload> {
  return new Promise((resolve, reject) => {
    let best: LocationPayload | null = null;
    let watchId: number | undefined;
    let settled = false;

    const cleanup = () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
      clearTimeout(timeoutId);
    };

    const finish = (payload: LocationPayload) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(payload);
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    const timeoutId = setTimeout(() => {
      if (best) {
        finish(best);
        return;
      }
      fail(
        new Error(
          getLocationErrorMessage({
            code: PositionError.TIMEOUT,
            message: 'Location timeout',
          }),
        ),
      );
    }, maxWaitMs);

    watchId = Geolocation.watchPosition(
      position => {
        const payload = toLocationPayload(position);
        const accuracy = payload.accuracy ?? 9999;

        if (!best || accuracy < (best.accuracy ?? 9999)) {
          best = payload;
        }

        if (accuracy <= targetAccuracyM) {
          finish(payload);
        }
      },
      error => fail(new Error(getLocationErrorMessage(error))),
      {
        ...options,
        enableHighAccuracy: true,
        distanceFilter: 0,
        maximumAge: 0,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );
  });
}

async function getAttendanceCoordinates(): Promise<LocationPayload> {
  try {
    return await watchBestPosition(ATTENDANCE_LOCATION_ATTEMPTS[0], 15000, 25);
  } catch (error) {
    // Fall through to single-shot attempts below.
    if (error instanceof Error && !error.message.includes('permission')) {
      // keep trying
    }
  }

  let lastError: Error | null = null;

  for (const options of ATTENDANCE_LOCATION_ATTEMPTS) {
    try {
      return await getCurrentPosition(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unable to get current location');
    }
  }

  throw lastError || new Error('Unable to get your current location.');
}

export async function getCurrentLocation(): Promise<LocationPayload> {
  if (attendanceLocationBusy) {
    throw new Error('Location is busy. Please try again in a moment.');
  }

  return withLocationLock(async () => {
    let lastError: Error | null = null;

    for (const options of LOCATION_ATTEMPTS) {
      try {
        return await getCurrentPosition(options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unable to get current location');
      }
    }

    throw lastError || new Error('Unable to get current location');
  });
}

export async function getLocationForAttendance(): Promise<LocationPayload | null> {
  return withLocationLock(async () => {
    attendanceLocationBusy = true;
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to mark attendance. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return null;
      }

      const coordinates = await getAttendanceCoordinates();
      return enrichLocationWithAddress(coordinates);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get your location.';

      Alert.alert('Location Error', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return null;
    } finally {
      await new Promise<void>(resolve => {
        setTimeout(resolve, 800);
      });
      attendanceLocationBusy = false;
    }
  });
}

export function formatGpsCoordinates(location?: LocationPayload): string {
  if (!location) {
    return 'Location unavailable';
  }

  const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

  if (location.accuracy != null && Number.isFinite(location.accuracy) && location.accuracy > 0) {
    return `${coords} (±${Math.round(location.accuracy)}m)`;
  }

  return coords;
}

export async function enrichLocationWithAddress(
  location: LocationPayload,
): Promise<LocationPayload> {
  try {
    const response = await geocodeApi.reverse(location.latitude, location.longitude);
    const address = response.data.location.address?.trim();
    if (address && !looksLikeCoordinates(address)) {
      return {
        ...location,
        address,
      };
    }
  } catch {
    // Keep GPS-only payload when reverse geocoding is unavailable.
  }

  return location;
}

export async function enrichLocationIfNeeded(
  location?: LocationPayload | null,
): Promise<LocationPayload | undefined | null> {
  if (!location) {
    return location;
  }

  const address = location.address?.trim();
  if (address && !shouldRefreshPlaceName(address)) {
    return location;
  }

  return enrichLocationWithAddress(location);
}

export async function enrichAttendanceLocations(
  attendance: Attendance | null,
): Promise<Attendance | null> {
  if (!attendance) {
    return attendance;
  }

  const [checkInLocation, checkOutLocation] = await Promise.all([
    enrichLocationIfNeeded(attendance.checkInLocation),
    enrichLocationIfNeeded(attendance.checkOutLocation),
  ]);

  return {
    ...attendance,
    ...(checkInLocation ? { checkInLocation } : {}),
    ...(checkOutLocation ? { checkOutLocation } : {}),
  };
}

export function formatLocationLabel(location?: LocationPayload): string {
  if (!location) {
    return 'Location unavailable';
  }

  const address = location.address?.trim();
  if (address && !looksLikeCoordinates(address)) {
    return address;
  }

  return formatGpsCoordinates(location);
}

export function formatLocationWithCoords(location?: LocationPayload): string {
  return formatLocationLabel(location);
}
