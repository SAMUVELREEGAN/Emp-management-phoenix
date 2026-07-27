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

const PRODUCTION_API_BASE_URL =
  'https://employee-management-app-epy7.onrender.com/api';

// 10.0.2.2 = Android emulator loopback to host machine
// Physical devices on same Wi-Fi use your PC LAN IP during development
const DEV_API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://192.168.29.254:5000/api'
    : 'http://localhost:5000/api';

export const API_BASE_URL =
  nativeConfig.API_BASE_URL ||
  (__DEV__ ? DEV_API_BASE_URL : PRODUCTION_API_BASE_URL);

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Render free tier can take ~30-60s to wake from sleep
export const REQUEST_TIMEOUT = __DEV__ ? 15000 : 60000;
