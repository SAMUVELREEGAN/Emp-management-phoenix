import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function dispatchReset(routes: Parameters<typeof CommonActions.reset>[0]['routes']) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes,
    }),
  );

  return true;
}

export function resetToAuth(): boolean {
  return (
    dispatchReset([
      {
        name: 'Auth',
        state: {
          index: 0,
          routes: [{ name: 'Login' }],
        },
      },
    ]) ?? false
  );
}

export function resetToAdmin(): boolean {
  return dispatchReset([{ name: 'Admin' }]) ?? false;
}

export function resetToEmployee(): boolean {
  return dispatchReset([{ name: 'Employee' }]) ?? false;
}

export function resetToHr(): boolean {
  return dispatchReset([{ name: 'Hr' }]) ?? false;
}

export function resetToSplash(): boolean {
  return dispatchReset([{ name: 'Splash' }]) ?? false;
}

import type { UserRole } from '../types';

export function resetForAuthenticatedUser(role: UserRole): boolean {
  if (role === 'admin') {
    return resetToAdmin();
  }
  if (role === 'hr') {
    return resetToHr();
  }
  return resetToEmployee();
}

export function waitForNavigationReady(): Promise<void> {
  return new Promise(resolve => {
    const checkReady = () => {
      if (navigationRef.isReady()) {
        resolve();
        return;
      }
      requestAnimationFrame(checkReady);
    };
    checkReady();
  });
}
