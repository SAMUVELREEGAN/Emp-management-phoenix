import { useEffect, useRef, useState } from 'react';
import { AppState, InteractionManager, type AppStateStatus } from 'react-native';
import { routeApi } from '../api/routeApi';
import { MIN_DISTANCE_METERS, UPLOAD_INTERVAL_MS } from '../services/routeTrackingTask';
import { getCurrentLocation, isAttendanceLocationBusy, requestLocationPermission } from '../utils/location';
import { useAuthStore } from '../store/authStore';
import type { LocationPayload } from '../types';

const ROUTE_START_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 15000;

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

export function useRouteRecorder(isActive: boolean) {
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const [ready, setReady] = useState(false);
  const bufferRef = useRef<LocationPayload[]>([]);
  const lastPointRef = useRef<LocationPayload | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isActive || isLoggingOut) {
      setReady(false);
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

    const pollLocation = async () => {
      if (cancelled || appStateRef.current !== 'active' || isAttendanceLocationBusy()) {
        return;
      }

      try {
        const granted = await requestLocationPermission();
        if (!granted || cancelled) {
          return;
        }

        const point = await getCurrentLocation();
        if (cancelled) {
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

        if (bufferRef.current.length >= 5) {
          await flush();
        }
      } catch {
        // Ignore transient GPS errors and retry on the next poll.
      }
    };

    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
    });

    void pollLocation();
    const pollTimer = setInterval(() => {
      void pollLocation();
    }, POLL_INTERVAL_MS);
    const flushTimer = setInterval(() => {
      void flush();
    }, UPLOAD_INTERVAL_MS);

    return () => {
      cancelled = true;
      appStateSub.remove();
      clearInterval(pollTimer);
      clearInterval(flushTimer);
      void flush();
    };
  }, [ready, isLoggingOut]);
}
