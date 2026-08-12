import https from 'https';
import { env } from '../config/env';
import { logger } from './logger';

interface NominatimAddress {
  house_number?: string;
  building?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface GoogleGeocodeResult {
  formatted_address?: string;
  geometry?: {
    location_type?: string;
  };
  types?: string[];
}

interface GoogleGeocodeResponse {
  status?: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
}

const geocodingHttpsAgent = new https.Agent({
  rejectUnauthorized: env.NODE_ENV === 'production',
});

const GOOGLE_PRECISION_RANK: Record<string, number> = {
  ROOFTOP: 4,
  RANGE_INTERPOLATED: 3,
  GEOMETRIC_CENTER: 2,
  APPROXIMATE: 1,
};

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value.trim());
}

export function cleanGoogleFormattedAddress(formatted: string): string {
  let cleaned = formatted.trim();

  // Remove Google Plus Code prefix (e.g. "P8CW+XPX ") while keeping the rest.
  cleaned = cleaned.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}\s*/i, '');

  // Drop trailing country for a cleaner label.
  cleaned = cleaned.replace(/,\s*India\s*$/i, '');

  return cleaned.trim();
}

function pickBestGoogleFormattedAddress(results?: GoogleGeocodeResult[]): string | null {
  if (!results?.length) {
    return null;
  }

  let best: { rank: number; address: string } | null = null;

  for (const result of results) {
    const formatted = result.formatted_address?.trim();
    if (!formatted) {
      continue;
    }

    const cleaned = cleanGoogleFormattedAddress(formatted);
    if (!cleaned || looksLikeCoordinates(cleaned)) {
      continue;
    }

    const rank = GOOGLE_PRECISION_RANK[result.geometry?.location_type ?? ''] ?? 0;
    if (!best || rank > best.rank) {
      best = { rank, address: cleaned };
    }
  }

  if (best?.address) {
    return best.address;
  }

  const fallback = results[0]?.formatted_address?.trim();
  return fallback ? cleanGoogleFormattedAddress(fallback) : null;
}

function formatOsmDisplayName(displayName?: string): string | null {
  if (!displayName?.trim()) {
    return null;
  }

  const parts = displayName
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !['india', 'ind'].includes(part.toLowerCase()));

  return parts.length ? parts.slice(0, 4).join(', ') : null;
}

function coordinateFallback(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function httpsGetJson<T>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 10000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent: geocodingHttpsAgent,
        headers: {
          Accept: 'application/json',
          ...headers,
        },
      },
      response => {
        let body = '';

        response.on('data', chunk => {
          body += chunk;
        });

        response.on('end', () => {
          if ((response.statusCode ?? 500) >= 400) {
            reject(new Error(`Geocoding HTTP ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      reject(new Error('Geocoding request timed out'));
    });
  });
}

function getGeocodingProvider(): 'osm' | 'google' | 'auto' {
  if (env.GEOCODING_PROVIDER) {
    return env.GEOCODING_PROVIDER;
  }

  return env.GOOGLE_MAPS_API_KEY?.trim() ? 'auto' : 'osm';
}

async function googleReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const apiKey = env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    logger.warn('GOOGLE_MAPS_API_KEY is not configured; skipping Google geocoding');
    return null;
  }

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: apiKey,
    language: 'en',
  });

  try {
    const data = await httpsGetJson<GoogleGeocodeResponse>(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );

    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.warn('Google reverse geocoding status', {
        status: data.status,
        error: data.error_message,
      });
    }

    return pickBestGoogleFormattedAddress(data.results);
  } catch (error) {
    logger.warn('Google reverse geocoding failed', error);
    return null;
  }
}

async function nominatimReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(latitude),
      lon: String(longitude),
      zoom: '18',
      addressdetails: '1',
    });

    const data = await httpsGetJson<NominatimResponse>(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        'User-Agent': 'EmployeeManagementApp/1.0 (attendance-checkin; contact@company.local)',
      },
    );

    return formatOsmDisplayName(data.display_name);
  } catch (error) {
    logger.warn('OpenStreetMap reverse geocoding failed', error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const fallback = coordinateFallback(latitude, longitude);
  const provider = getGeocodingProvider();

  if (provider === 'osm') {
    const osmAddress = await nominatimReverseGeocode(latitude, longitude);
    return osmAddress || fallback;
  }

  if (provider === 'google') {
    const googleAddress = await googleReverseGeocode(latitude, longitude);
    return googleAddress || fallback;
  }

  const googleAddress = await googleReverseGeocode(latitude, longitude);
  if (googleAddress) {
    return googleAddress;
  }

  const osmAddress = await nominatimReverseGeocode(latitude, longitude);
  return osmAddress || fallback;
}

export async function resolveLocationAddress(location: {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}): Promise<{
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
}> {
  const address = await reverseGeocode(location.latitude, location.longitude);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    address,
    accuracy: location.accuracy,
  };
}
