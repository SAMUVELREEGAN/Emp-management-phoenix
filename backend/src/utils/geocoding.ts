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
}

interface GoogleGeocodeResponse {
  status?: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
}

const geocodingHttpsAgent = new https.Agent({
  // Windows dev machines with antivirus SSL inspection often fail Node fetch TLS.
  rejectUnauthorized: env.NODE_ENV === 'production',
});

const GOOGLE_PRECISION_RANK: Record<string, number> = {
  ROOFTOP: 4,
  RANGE_INTERPOLATED: 3,
  GEOMETRIC_CENTER: 2,
  APPROXIMATE: 1,
};

const formatAddressParts = (address?: NominatimAddress): string => {
  if (!address) {
    return '';
  }

  const street = [address.house_number, address.building, address.road]
    .filter(Boolean)
    .join(' ')
    .trim();

  const locality =
    address.neighbourhood ||
    address.suburb ||
    address.city ||
    address.town ||
    address.village;

  const parts = [
    street,
    locality,
    address.county,
    address.state,
    address.postcode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};

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

  return env.NODE_ENV === 'development' ? 'osm' : 'auto';
}

function pickBestGoogleAddress(results?: GoogleGeocodeResult[]): string | null {
  if (!results?.length) {
    return null;
  }

  let best: { rank: number; address: string } | null = null;

  for (const result of results) {
    const address = result.formatted_address?.trim();
    if (!address) {
      continue;
    }

    const locationType = result.geometry?.location_type ?? 'APPROXIMATE';
    const rank = GOOGLE_PRECISION_RANK[locationType] ?? 0;

    if (!best || rank > best.rank) {
      best = { rank, address };
    }
  }

  return best?.address ?? results[0]?.formatted_address?.trim() ?? null;
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

  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: apiKey,
      language: 'en',
      result_type: 'street_address|premise|subpremise|route',
    });

    const data = await httpsGetJson<GoogleGeocodeResponse>(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );

    const address = pickBestGoogleAddress(data.results);
    if (address) {
      return address;
    }

    logger.warn('Google reverse geocoding returned no usable address', {
      status: data.status,
      errorMessage: data.error_message,
    });
    return null;
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
      zoom: '19',
      addressdetails: '1',
    });

    const data = await httpsGetJson<NominatimResponse>(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        'User-Agent': 'EmployeeManagementApp/1.0 (attendance-checkin; contact@company.local)',
      },
    );

    const formatted = formatAddressParts(data.address);
    const displayName = data.display_name?.trim();

    if (formatted) {
      return formatted;
    }

    return displayName || null;
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
  if (osmAddress) {
    return osmAddress;
  }

  return fallback;
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

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value.trim());
}
