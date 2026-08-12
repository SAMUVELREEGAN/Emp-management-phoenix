import { NativeModules, TurboModuleRegistry } from 'react-native';

export type NativeEnvConfig = {
  API_BASE_URL?: string;
  GOOGLE_MAPS_API_KEY?: string;
};

type ConfigModule = {
  getConfig: () => { config?: NativeEnvConfig };
};

/**
 * Read .env values from the native module without importing react-native-config.
 * The package index calls getConfig() immediately and crashes when the turbo
 * module is null (common with Bridgeless / New Architecture).
 */
export function loadNativeEnv(): NativeEnvConfig {
  try {
    const turbo = TurboModuleRegistry.get<ConfigModule>('RNCConfigModule');
    if (turbo?.getConfig) {
      return turbo.getConfig()?.config ?? {};
    }
  } catch {
    // Native turbo module unavailable.
  }

  try {
    const legacy = NativeModules.RNCConfigModule as ConfigModule | NativeEnvConfig | undefined;
    if (legacy && typeof legacy === 'object') {
      if (typeof (legacy as ConfigModule).getConfig === 'function') {
        return (legacy as ConfigModule).getConfig()?.config ?? {};
      }
      return legacy as NativeEnvConfig;
    }
  } catch {
    // Legacy native module unavailable.
  }

  return {};
}
