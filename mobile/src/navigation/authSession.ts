import { InteractionManager } from 'react-native';
import { authApi } from '../api/authApi';
import { stopRouteTrackingService } from '../services/routeTrackingCleanup';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { resetForAuthenticatedUser, resetToAuth, waitForNavigationReady } from './navigationRef';

const LOGOUT_SETTLE_MS = 900;

let logoutInProgress = false;

function waitForNavigationSettle(): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, LOGOUT_SETTLE_MS);
      });
    });
  });
}

function waitForUiTeardown(): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 500);
        });
      });
    });
  });
}

/** Navigate to login first, then clear persisted auth (Fabric-safe logout). */
export async function performLogout(): Promise<void> {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;

  try {
    const { setLoggingOut } = useAuthStore.getState();
    setLoggingOut(true);

    await stopRouteTrackingService();
    await waitForUiTeardown();
    await waitForNavigationReady();

    resetToAuth();
    await waitForNavigationSettle();

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
  void waitForNavigationReady().then(() => {
    resetForAuthenticatedUser(user.role);
  });
}
