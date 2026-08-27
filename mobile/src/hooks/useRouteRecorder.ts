import { useEffect, useRef, useState } from 'react';
import { AppState, InteractionManager, type AppStateStatus } from 'react-native';
import Geolocation, { type GeoPosition } from 'react-native-geolocation-service';
import { routeApi } from '../api/routeApi';
import { MIN_DISTANCE_METERS, UPLOAD_INTERVAL_MS } from '../services/routeTrackingTask';
import {
  startRouteTrackingService,
  stopRouteTrackingService,
} from '../services/routeTrackingCleanup';
import { isAttendanceLocationBusy, requestBackgroundLocationPermission, requestLocationPermission } from '../utils/location';
import { useAuthStore } from '../store/authStore';
import type { LocationPayload } from '../types';

const ROUTE_START_DELAY_MS = 2000;
const MAX_BUFFER_SIZE = 3;

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

function toLocationPayload(position: GeoPosition): LocationPayload {
  const payload: LocationPayload = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    locationTimestamp: new Date(position.timestamp).toISOString(),
    isMocked: position.mocked === true,
  };

  if (
    position.coords.accuracy != null &&
    Number.isFinite(position.coords.accuracy) &&
    position.coords.accuracy > 0
  ) {
    payload.accuracy = Math.round(position.coords.accuracy * 10) / 10;
  }

  return payload;
}

export function useRouteRecorder(isActive: boolean) {
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const [ready, setReady] = useState(false);
  const bufferRef = useRef<LocationPayload[]>([]);
  const lastPointRef = useRef<LocationPayload | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isActive || isLoggingOut) {
      setReady(false);
      void stopRouteTrackingService();
      return;
    }

    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const task = InteractionManager.runAfterInteractions(() => {
      delayTimer = setTimeout(() => {
        if (!cancelled) {
          setReady(true);
        }
      }, ROUTE_START_DELAY_MS);
    });

    return () => {
      cancelled = true;
      task.cancel();
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
      setReady(false);
      bufferRef.current = [];
      lastPointRef.current = null;
      void stopRouteTrackingService();
    };
  }, [isActive, isLoggingOut]);

  useEffect(() => {
    if (!ready || isLoggingOut) {
      return;
    }

    let cancelled = false;

    const flush = async () => {
      if (bufferRef.current.length === 0) {
        return;
      }
      const batch = [...bufferRef.current];
      bufferRef.current = [];
      try {
        await routeApi.appendPoints(batch);
      } catch {
        bufferRef.current.unshift(...batch);
      }
    };

    const recordPoint = (point: LocationPayload) => {
      if (point.isMocked) {
        return;
      }

      if (
        lastPointRef.current &&
        distanceMeters(lastPointRef.current, point) < MIN_DISTANCE_METERS
      ) {
        return;
      }

      lastPointRef.current = point;
      bufferRef.current.push(point);

      if (bufferRef.current.length >= MAX_BUFFER_SIZE) {
        void flush();
      }
    };

    const stopForegroundWatch = () => {
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    const startForegroundWatch = async () => {
      if (cancelled || watchIdRef.current != null || isAttendanceLocationBusy()) {
        return;
      }

      const granted = await requestBackgroundLocationPermission({ showDeniedAlert: false });
      if (!granted || cancelled) {
        return;
      }

      watchIdRef.current = Geolocation.watchPosition(
        position => {
          if (cancelled || appStateRef.current !== 'active' || isAttendanceLocationBusy()) {
            return;
          }
          recordPoint(toLocationPayload(position));
        },
        () => {
          // Ignore transient GPS errors; next update will retry.
        },
        {
          enableHighAccuracy: true,
          distanceFilter: MIN_DISTANCE_METERS,
          interval: 5000,
          fastestInterval: 4000,
          showLocationDialog: true,
          forceRequestLocation: true,
          accuracy: { android: 'high', ios: 'best' },
        },
      );
    };

    const syncTrackingMode = async (nextState: AppStateStatus) => {
      appStateRef.current = nextState;

      if (nextState === 'active') {
        await stopRouteTrackingService();
        await startForegroundWatch();
        return;
      }

      stopForegroundWatch();
      await flush();
      await startRouteTrackingService();
    };

    void syncTrackingMode(AppState.currentState);

    const appStateSub = AppState.addEventListener('change', nextState => {
      void syncTrackingMode(nextState);
    });

    const flushTimer = setInterval(() => {
      void flush();
    }, UPLOAD_INTERVAL_MS);

    return () => {
      cancelled = true;
      appStateSub.remove();
      clearInterval(flushTimer);
      stopForegroundWatch();
      void flush();
      void stopRouteTrackingService();
    };
  }, [ready, isLoggingOut]);
}
