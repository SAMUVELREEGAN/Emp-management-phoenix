import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { API_BASE_URL } from '../constants/config';
import type { LocationPayload } from '../types';

export const ROUTE_TRACKING_TASK_NAME = 'RouteTracking';
export const UPLOAD_INTERVAL_MS = 8000;
export const MIN_DISTANCE_METERS = 8;
export const POLL_INTERVAL_MS = 5000;

const AUTH_STORAGE_KEY = 'auth-storage';

function distanceMeters(a: LocationPayload, b: LocationPayload): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

async function getAuthToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function uploadPoints(points: LocationPayload[]): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  await axios.post(
    `${API_BASE_URL}/routes/points`,
    {
      points: points.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        address: point.address,
        recordedAt: new Date().toISOString(),
      })),
    },
    {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

function getCurrentPosition(): Promise<LocationPayload> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
        forceRequestLocation: true,
      },
    );
  });
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function routeTrackingBackgroundTask(): Promise<void> {
  const buffer: LocationPayload[] = [];
  let lastPoint: LocationPayload | null = null;
  let lastUploadAt = Date.now();

  const flush = async () => {
    if (buffer.length === 0) {
      return;
    }

    const batch = buffer.splice(0, buffer.length);
    try {
      await uploadPoints(batch);
      lastUploadAt = Date.now();
    } catch {
      buffer.unshift(...batch);
    }
  };

  await new Promise<void>(async resolve => {
    while (BackgroundService.isRunning()) {
      try {
        const point = await getCurrentPosition();
        const shouldRecord =
          !lastPoint || distanceMeters(lastPoint, point) >= MIN_DISTANCE_METERS;

        if (shouldRecord) {
          lastPoint = point;
          buffer.push(point);

          if (buffer.length >= 5) {
            await flush();
          }
        }
      } catch {
        // Ignore transient GPS errors and retry on the next poll.
      }

      if (Date.now() - lastUploadAt >= UPLOAD_INTERVAL_MS) {
        await flush();
      }

      await sleep(POLL_INTERVAL_MS);
    }

    await flush();
    resolve();
  });
}

export const routeTrackingServiceOptions = {
  taskName: ROUTE_TRACKING_TASK_NAME,
  taskTitle: 'Route tracking active',
  taskDesc: 'Recording your location while checked in',
  taskIcon: {
    name: 'ic_notification',
    type: 'drawable',
  },
  color: '#FFD700',
  foregroundServiceType: ['location'] as ('location')[],
  parameters: {},
};
