import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';

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
