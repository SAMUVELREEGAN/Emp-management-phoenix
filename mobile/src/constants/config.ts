import { Platform } from 'react-native';

type EnvConfig = {
  API_BASE_URL?: string;
};

function loadNativeConfig(): EnvConfig {
  try {
    // react-native-config can throw if the native module is not linked yet
    // (common with New Architecture): "Cannot read property 'getConfig' of null"
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-config');
    return (mod?.default ?? mod ?? {}) as EnvConfig;
  } catch {
    return {};
  }
}

const nativeConfig = loadNativeConfig();

// 10.0.2.2 = Android emulator loopback to host machine
// Physical devices must use your PC's LAN IP
const DEFAULT_API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://192.168.29.254:5000/api'
    : 'http://localhost:5000/api';

export const API_BASE_URL = nativeConfig.API_BASE_URL || DEFAULT_API_BASE_URL;

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const REQUEST_TIMEOUT = 15000;
