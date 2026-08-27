import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { PositionError, type GeoPosition } from 'react-native-geolocation-service';
import type { GeoOptions } from 'react-native-geolocation-service';
import { geocodeApi } from '../api/geocodeApi';
import { reverseGeocodeOnDevice } from './deviceGeocoder';
import type { Attendance, LocationPayload } from '../types';

const TARGET_ACCURACY_METERS = 25;
const MAX_ACCEPTABLE_ACCURACY_METERS = 150;
const MAX_GEOCAM_ACCURACY_METERS = 3000;
const GEOCAM_WATCH_TIMEOUT_MS = 20000;
const GEOCAM_TARGET_ACCURACY_METERS = 50;
const LOCATION_MAX_AGE_MS = 15000;
const WATCH_TIMEOUT_MS = 35000;
const DEBUG_LOCATION = __DEV__;

const HIGH_ACCURACY_OPTIONS: GeoOptions = {
  enableHighAccuracy: true,
  timeout: WATCH_TIMEOUT_MS,
  maximumAge: 0,
  showLocationDialog: true,
  forceRequestLocation: true,
  accuracy: { android: 'high', ios: 'best' },
};

let locationLock: Promise<void> = Promise.resolve();
let attendanceLocationBusy = false;

function debugLocation(stage: string, data: Record<string, unknown>): void {
  if (!DEBUG_LOCATION) {
    return;
  }
  console.log(`[AttendanceLocation] ${stage}`, data);
}

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value.trim());
}

const INDIAN_STATE_NAMES = new Set(
  [
    'tamil nadu',
    'kerala',
    'karnataka',
    'andhra pradesh',
    'telangana',
    'maharashtra',
    'gujarat',
    'rajasthan',
    'punjab',
    'haryana',
    'delhi',
    'west bengal',
    'uttar pradesh',
    'madhya pradesh',
    'bihar',
    'odisha',
  ].map(name => name.toLowerCase()),
);

function getAddressParts(address: string): string[] {
  return address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !['india', 'ind'].includes(part.toLowerCase()))
    .filter(part => !/^\d{5,6}$/.test(part));
}

function hasStreetLevelDetail(parts: string[]): boolean {
  return parts.some(
    part =>
      /\d/.test(part) ||
      /\b(road|street|st|main|colony|nagar|ward|lane|avenue|ave|highway|hwy|petrol|temple|home|building)\b/i.test(
        part,
      ),
  );
}

function isAdminOnlyAddress(address?: string): boolean {
  const parts = getAddressParts(address ?? '');
  if (parts.length < 2) {
    return true;
  }

  const lastPart = parts[parts.length - 1].toLowerCase();
  if (!INDIAN_STATE_NAMES.has(lastPart)) {
    return false;
  }

  if (hasStreetLevelDetail(parts)) {
    return false;
  }

  if (parts.length === 2) {
    return true;
  }

  if (parts.length === 3) {
    return true;
  }

  if (parts.length === 4 && /^\d{5,6}$/.test(parts[3])) {
    return true;
  }

  if (parts.length >= 4) {
    return parts[0].toLowerCase() === parts[1].toLowerCase();
  }

  return false;
}

function isGenericAddress(address?: string): boolean {
  if (!address?.trim() || looksLikeCoordinates(address)) {
    return true;
  }

  return isAdminOnlyAddress(address);
}

function toLocationPayload(position: GeoPosition): LocationPayload {
  const { latitude, longitude, accuracy } = position.coords;
  const capturedAt = new Date(position.timestamp).toISOString();

  const payload: LocationPayload = {
    latitude,
    longitude,
    locationTimestamp: capturedAt,
    isMocked: position.mocked === true,
  };

  if (accuracy != null && Number.isFinite(accuracy) && accuracy > 0) {
    payload.accuracy = Math.round(accuracy * 10) / 10;
  }

  debugLocation('position', {
    latitude: payload.latitude,
    longitude: payload.longitude,
    accuracy: payload.accuracy,
    timestamp: payload.locationTimestamp,
    mocked: payload.isMocked,
    provider: Platform.OS,
  });

  return payload;
}

function getLocationErrorMessage(error: { code: number; message: string }): string {
  switch (error.code) {
    case PositionError.PERMISSION_DENIED:
      return 'Location permission is denied. Open app settings, allow location access, and enable Precise location.';
    case PositionError.POSITION_UNAVAILABLE:
      return 'Location is unavailable. Turn on GPS/location services and try again outdoors or near a window.';
    case PositionError.TIMEOUT:
      return 'Could not get a precise GPS fix in time. Move to an open area, ensure GPS is on, and try again.';
    case PositionError.PLAY_SERVICE_NOT_AVAILABLE:
      return 'Google Play location services are unavailable on this device.';
    case PositionError.SETTINGS_NOT_SATISFIED:
      return 'Location services are turned off. Enable GPS/high accuracy mode in your phone settings.';
    default:
      return error.message || 'Unable to get your current location.';
  }
}

function assertFreshLocation(payload: LocationPayload): void {
  if (!payload.locationTimestamp) {
    return;
  }

  const capturedAt = new Date(payload.locationTimestamp).getTime();
  if (Number.isNaN(capturedAt)) {
    return;
  }

  const ageMs = Date.now() - capturedAt;
  if (ageMs > LOCATION_MAX_AGE_MS) {
    throw new Error('GPS reading was too old. Please try again to capture a fresh location.');
  }
}

function assertGeoCamLocationQuality(payload: LocationPayload): void {
  if (payload.isMocked) {
    throw new Error(
      'Mock or fake location detected. Disable mock-location apps and use your real GPS position.',
    );
  }

  const accuracy = payload.accuracy;
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return;
  }

  if (accuracy > MAX_GEOCAM_ACCURACY_METERS) {
    throw new Error(
      `Your location accuracy is too low (${Math.round(accuracy)} meters). Turn on GPS, enable Precise location, and move to an open area.`,
    );
  }
}

export function isLowAccuracyGeoCamLocation(accuracy?: number): boolean {
  return (
    accuracy != null &&
    Number.isFinite(accuracy) &&
    accuracy > MAX_ACCEPTABLE_ACCURACY_METERS
  );
}

function assertAttendanceLocationQuality(payload: LocationPayload): void {
  if (payload.isMocked) {
    throw new Error(
      'Mock or fake location detected. Disable mock-location apps and use your real GPS position.',
    );
  }

  assertFreshLocation(payload);

  const accuracy = payload.accuracy;
  if (accuracy == null || !Number.isFinite(accuracy)) {
    throw new Error(
      'Could not verify GPS accuracy. Turn on GPS/high accuracy mode and try again in an open area.',
    );
  }

  if (accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
    throw new Error(
      `Your location accuracy is low (${Math.round(accuracy)} meters). Turn on GPS, enable Precise location, move to an open area, and try again.`,
    );
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

export function formatAccuracyMeters(accuracy?: number): string {
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy <= 0) {
    return 'Unknown';
  }
  return `${Math.round(accuracy)} meters`;
}

export function isLowAccuracyLocation(accuracy?: number): boolean {
  return accuracy != null && Number.isFinite(accuracy) && accuracy > MAX_ACCEPTABLE_ACCURACY_METERS;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const fineResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (fineResult === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    const coarseResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );

    return coarseResult === PermissionsAndroid.RESULTS.GRANTED;
  }

  const status = await Geolocation.requestAuthorization('whenInUse');
  return status === 'granted';
}

async function assertPreciseLocationPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const fineGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  if (fineGranted) {
    return;
  }

  const coarseGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );

  if (coarseGranted) {
    throw new Error(
      'Only approximate location is allowed. Open app settings and enable Precise location for attendance.',
    );
  }

  throw new Error(
    'Location permission is required. Allow location access and enable Precise location in app settings.',
  );
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
        maximumAge: 0,
        distanceFilter: 0,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );
  });
}

async function getAttendanceCoordinates(): Promise<LocationPayload> {
  debugLocation('acquire-start', { mode: 'high-accuracy-watch' });

  try {
    const watched = await watchBestPosition(
      HIGH_ACCURACY_OPTIONS,
      WATCH_TIMEOUT_MS,
      TARGET_ACCURACY_METERS,
    );
    debugLocation('acquire-watch-success', {
      accuracy: watched.accuracy,
      timestamp: watched.locationTimestamp,
    });
    return watched;
  } catch (error) {
    debugLocation('acquire-watch-fallback', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }

  const singleShot = await getCurrentPosition(HIGH_ACCURACY_OPTIONS);
  debugLocation('acquire-single-shot', {
    accuracy: singleShot.accuracy,
    timestamp: singleShot.locationTimestamp,
  });
  return singleShot;
}

export async function getCurrentLocation(): Promise<LocationPayload> {
  if (attendanceLocationBusy) {
    throw new Error('Location is busy. Please try again in a moment.');
  }

  return withLocationLock(async () => {
    await assertPreciseLocationPermission();
    const coordinates = await getAttendanceCoordinates();
    assertAttendanceLocationQuality(coordinates);
    return enrichLocationWithAddress(coordinates);
  });
}

export async function getLocationForGeoCam(options?: {
  showAlerts?: boolean;
}): Promise<LocationPayload | null> {
  const showAlerts = options?.showAlerts ?? true;

  return withLocationLock(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission is required for GeoCam reports.');
      }

      let coordinates: LocationPayload;
      try {
        coordinates = await watchBestPosition(
          HIGH_ACCURACY_OPTIONS,
          GEOCAM_WATCH_TIMEOUT_MS,
          GEOCAM_TARGET_ACCURACY_METERS,
        );
      } catch {
        coordinates = await getCurrentPosition({
          ...HIGH_ACCURACY_OPTIONS,
          timeout: 15000,
        });
      }

      assertGeoCamLocationQuality(coordinates);
      const enriched = await enrichLocationWithAddress(coordinates);
      debugLocation('geocam-final-payload', {
        accuracy: enriched.accuracy,
        addressLength: enriched.address?.length ?? 0,
        timestamp: enriched.locationTimestamp,
      });
      return enriched;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get your location for GeoCam.';

      if (showAlerts) {
        Alert.alert('Location Error', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      }
      return null;
    }
  });
}

export async function getLocationForAttendance(options?: {
  showAlerts?: boolean;
}): Promise<LocationPayload | null> {
  const showAlerts = options?.showAlerts ?? true;

  return withLocationLock(async () => {
    attendanceLocationBusy = true;
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        if (showAlerts) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to mark attendance. Enable Precise location in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ],
          );
        }
        return null;
      }

      await assertPreciseLocationPermission();

      const coordinates = await getAttendanceCoordinates();
      assertAttendanceLocationQuality(coordinates);

      const enriched = await enrichLocationWithAddress(coordinates);
      debugLocation('final-payload', {
        accuracy: enriched.accuracy,
        addressLength: enriched.address?.length ?? 0,
        timestamp: enriched.locationTimestamp,
      });
      return enriched;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get your precise location.';

      if (showAlerts) {
        Alert.alert('Location Error', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      }
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
  const existingAddress = location.address?.trim();
  if (existingAddress && !isGenericAddress(existingAddress)) {
    return location;
  }

  try {
    debugLocation('reverse-geocode-request', {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    });

    const deviceAddress = await reverseGeocodeOnDevice(
      location.latitude,
      location.longitude,
    );
    debugLocation('device-geocode-response', {
      addressLength: deviceAddress?.length ?? 0,
      isGeneric: deviceAddress ? isGenericAddress(deviceAddress) : true,
    });

    if (
      deviceAddress &&
      !looksLikeCoordinates(deviceAddress) &&
      !isGenericAddress(deviceAddress)
    ) {
      return {
        ...location,
        address: deviceAddress,
      };
    }

    const response = await geocodeApi.reverse(
      location.latitude,
      location.longitude,
      location.accuracy,
    );

    const address = response.data.location.address?.trim();
    debugLocation('reverse-geocode-response', {
      addressLength: address?.length ?? 0,
      isGeneric: address ? isGenericAddress(address) : true,
    });

    if (address && !looksLikeCoordinates(address) && !isGenericAddress(address)) {
      return {
        ...location,
        address,
      };
    }

    if (deviceAddress && !looksLikeCoordinates(deviceAddress)) {
      return {
        ...location,
        address: deviceAddress,
      };
    }
  } catch (error) {
    debugLocation('reverse-geocode-failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
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
  if (address && !isGenericAddress(address)) {
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
  if (address && !looksLikeCoordinates(address) && !isGenericAddress(address)) {
    return address;
  }

  return formatGpsCoordinates(location);
}

export function formatLocationWithCoords(location?: LocationPayload): string {
  return formatLocationLabel(location);
}
