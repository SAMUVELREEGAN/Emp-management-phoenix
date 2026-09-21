import { loadNativeEnv } from './nativeEnv';

const PRODUCTION_API_BASE_URL =
  'https://employee-management-app-epy7.onrender.com/api';

// Fallback when react-native-config is unavailable in dev builds.
// Must match mobile/.env — use production unless you explicitly set a local URL there.
const DEV_API_BASE_URL = PRODUCTION_API_BASE_URL;

const nativeConfig = loadNativeEnv();
const nativeApiBaseUrl = String(nativeConfig.API_BASE_URL ?? '').trim();

const resolvedApiBaseUrl = !__DEV__
  ? nativeApiBaseUrl.startsWith('https://')
    ? nativeApiBaseUrl
    : PRODUCTION_API_BASE_URL
  : nativeApiBaseUrl || DEV_API_BASE_URL;

export const API_BASE_URL = resolvedApiBaseUrl;

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const REQUEST_TIMEOUT = API_BASE_URL.startsWith('https://')
  ? 60000
  : 15000;
