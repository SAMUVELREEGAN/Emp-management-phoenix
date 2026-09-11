import { InteractionManager } from 'react-native';
import { authApi } from '../api/authApi';
import { stopRouteTrackingService } from '../services/routeTrackingCleanup';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import { resetForAuthenticatedUser, resetToAuth, waitForNavigationReady } from './navigationRef';

const LOGOUT_SETTLE_MS = 450;

let logoutInProgress = false;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForNavigationSettle(): Promise<void> {
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

/** Reset to login inside the same NavigationContainer, then clear persisted auth. */
export async function performLogout(): Promise<void> {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;

  try {
    useAuthStore.getState().setLoggingOut(true);

    await stopRouteTrackingService();
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
