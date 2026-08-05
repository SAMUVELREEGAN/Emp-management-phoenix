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

// Set API_BASE_URL in mobile/.env (rebuild app after changes).
// Local examples:
//   Android emulator + PC backend: http://10.0.2.2:5000/api
//   Physical phone + PC backend:     http://YOUR_PC_LAN_IP:5000/api
export const API_BASE_URL =
  nativeConfig.API_BASE_URL?.trim() || PRODUCTION_API_BASE_URL;

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Render free tier can take ~30-60s to wake from sleep
export const REQUEST_TIMEOUT = API_BASE_URL.startsWith('https://')
  ? 60000
  : 15000;
