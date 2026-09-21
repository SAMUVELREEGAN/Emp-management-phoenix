import { InteractionManager } from 'react-native';

/** Defer navigation so Fabric can finish unmounting lists/modals (Android). */
export function scheduleFabricSafeNavigation(action: () => void, delayMs = 120): void {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      setTimeout(action, delayMs);
    });
  });
}
