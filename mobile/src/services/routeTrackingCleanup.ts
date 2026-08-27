import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import {
  routeTrackingBackgroundTask,
  routeTrackingServiceOptions,
} from './routeTrackingTask';

export async function startRouteTrackingService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (!BackgroundService.isRunning()) {
      await BackgroundService.start(routeTrackingBackgroundTask, routeTrackingServiceOptions);
    }
  } catch {
    // Ignore start errors; foreground tracking may still work.
  }
}

export async function stopRouteTrackingService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
  } catch {
    // Ignore stop errors during logout/teardown.
  }
}
