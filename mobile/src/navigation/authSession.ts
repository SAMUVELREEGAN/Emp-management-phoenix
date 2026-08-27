import { InteractionManager } from 'react-native';
import { authApi } from '../api/authApi';
import { stopRouteTrackingService } from '../services/routeTrackingCleanup';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

const LOGOUT_SETTLE_MS = 1200;

let logoutInProgress = false;

function waitForUiTeardown(): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, LOGOUT_SETTLE_MS);
        });
      });
    });
  });
}

/** Unmount role navigators first, then clear persisted auth (Fabric-safe logout). */
export async function performLogout(): Promise<void> {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;

  try {
    useAuthStore.getState().setLoggingOut(true);

    await stopRouteTrackingService();
    await waitForUiTeardown();

    try {
      await authApi.logout();
    } catch {
      // Local logout should still complete if the API call fails.
    }

    useAuthStore.getState().logout();
  } finally {
    logoutInProgress = false;
  }
}

export function completeLoginSession(token: string, user: User): void {
  useAuthStore.getState().setAuth(token, user);
}
