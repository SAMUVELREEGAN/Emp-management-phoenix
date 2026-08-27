import https from 'https';
import { env } from '../config/env';
import { logger } from './logger';

interface NominatimAddress {
  house_number?: string;
  building?: string;
  road?: string;
  hamlet?: string;
  locality?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
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

const GOOGLE_TYPE_SPECIFICITY: Record<string, number> = {
  premise: 100,
  subpremise: 95,
  street_address: 90,
  route: 80,
  neighborhood: 75,
  sublocality_level_2: 70,
  sublocality_level_1: 65,
  sublocality: 60,
  locality: 55,
  administrative_area_level_3: 50,
  postal_town: 45,
  administrative_area_level_2: 20,
  administrative_area_level_1: 10,
  country: 1,
};

const INDIAN_STATE_NAMES = new Set(
  [
    'andhra pradesh',
    'arunachal pradesh',
    'assam',
    'bihar',
    'chhattisgarh',
    'goa',
    'gujarat',
    'haryana',
    'himachal pradesh',
    'jharkhand',
    'karnataka',
    'kerala',
    'madhya pradesh',
    'maharashtra',
    'manipur',
    'meghalaya',
    'mizoram',
    'nagaland',
    'odisha',
    'punjab',
    'rajasthan',
    'sikkim',
    'tamil nadu',
    'telangana',
    'tripura',
    'uttar pradesh',
    'uttarakhand',
    'west bengal',
    'delhi',
    'puducherry',
    'jammu and kashmir',
    'ladakh',
  ].map(name => name.toLowerCase()),
);

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value.trim());
}

function getAddressParts(address: string): string[] {
  return address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !['india', 'ind'].includes(part.toLowerCase()))
    .filter(part => !/^\d{5,6}$/.test(part));
}

function hasStreetLevelDetail(parts: string[]): boolean {
  return parts.some(
    part =>
      /\d/.test(part) ||
      /\b(road|street|st|main|colony|nagar|ward|lane|avenue|ave|highway|hwy|petrol|temple|home|building)\b/i.test(
        part,
      ),
  );
}

function isAdminOnlyAddress(address?: string): boolean {
  const parts = getAddressParts(address ?? '');
  if (parts.length < 2) {
    return true;
  }

  const lastPart = parts[parts.length - 1].toLowerCase();
  if (!INDIAN_STATE_NAMES.has(lastPart)) {
    return false;
  }

  if (hasStreetLevelDetail(parts)) {
    return false;
  }

  // "Manamadurai, Tamil Nadu"
  if (parts.length === 2) {
    return true;
  }

  // "Manamadurai, Sivaganga, Tamil Nadu" — town + district + state only.
  if (parts.length === 3) {
    return true;
  }

  if (parts.length === 4 && /^\d{5,6}$/.test(parts[3])) {
    return true;
  }

  // "Maranadu, Manamadurai, Sivaganga, Tamil Nadu" — village differs from town.
  if (parts.length >= 4) {
    return parts[0].toLowerCase() === parts[1].toLowerCase();
  }

  return false;
}

function isGenericAddress(address?: string): boolean {
  if (!address?.trim() || looksLikeCoordinates(address)) {
    return true;
  }

  return isAdminOnlyAddress(address);
}

function addressSpecificityScore(address: string): number {
  const parts = getAddressParts(address);
  if (isAdminOnlyAddress(address)) {
    return -100;
  }

  let score = parts.length * 10;

  if (parts.length >= 2 && parts[0].toLowerCase() !== parts[1].toLowerCase()) {
    score += 35;
  }

  if (hasStreetLevelDetail(parts)) {
    score += 40;
  }

  return score;
}

function getGoogleComponent(
  components: GoogleAddressComponent[] | undefined,
  ...types: string[]
): string | undefined {
  for (const type of types) {
    const match = components?.find(component => component.types.includes(type));
    if (match?.long_name?.trim()) {
      return match.long_name.trim();
    }
  }
  return undefined;
}

function extractFinestPlaceFromGoogleComponents(
  components?: GoogleAddressComponent[],
): string | null {
  if (!components?.length) {
    return null;
  }

  const sublocality = getGoogleComponent(
    components,
    'sublocality_level_3',
    'sublocality_level_2',
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
  );
  const adminLevel3 = getGoogleComponent(components, 'administrative_area_level_3');
  const locality = getGoogleComponent(components, 'locality');
  const postalTown = getGoogleComponent(components, 'postal_town');

  const candidates = [sublocality, adminLevel3, locality].filter(Boolean) as string[];

  for (const name of candidates) {
    if (postalTown && name.toLowerCase() === postalTown.toLowerCase()) {
      continue;
    }
    if (locality && name.toLowerCase() !== locality.toLowerCase()) {
      return name;
    }
    if (!postalTown || name.toLowerCase() !== postalTown.toLowerCase()) {
      return name;
    }
  }

  return candidates[0] ?? postalTown ?? locality ?? null;
}

function buildGooglePlaceLabel(components?: GoogleAddressComponent[]): string | null {
  if (!components?.length) {
    return null;
  }

  const streetLine = [
    getGoogleComponent(components, 'street_number'),
    getGoogleComponent(components, 'route'),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const premise = getGoogleComponent(components, 'premise', 'establishment', 'point_of_interest');
  const neighborhood = getGoogleComponent(components, 'neighborhood');
  const sublocality = getGoogleComponent(
    components,
    'sublocality_level_2',
    'sublocality_level_1',
    'sublocality',
  );

  const finestPlace = extractFinestPlaceFromGoogleComponents(components);
  const nearbyTown =
    getGoogleComponent(components, 'postal_town') ||
    getGoogleComponent(components, 'locality');
  const district = getGoogleComponent(components, 'administrative_area_level_2');
  const state = getGoogleComponent(components, 'administrative_area_level_1');
  const postcode = getGoogleComponent(components, 'postal_code');

  const secondaryPlace =
    nearbyTown && finestPlace && nearbyTown.toLowerCase() !== finestPlace.toLowerCase()
      ? nearbyTown
      : undefined;

  const parts = [
    streetLine || premise,
    neighborhood,
    sublocality,
    finestPlace,
    secondaryPlace,
    district && district !== finestPlace ? district : undefined,
    state,
    postcode,
  ].filter((part, index, arr): part is string => !!part && arr.indexOf(part) === index);

  return parts.length ? parts.join(', ') : null;
}

function formatGoogleAddressFromComponents(
  components?: GoogleAddressComponent[],
): string | null {
  return buildGooglePlaceLabel(components);
}

function scoreGoogleResult(result: GoogleGeocodeResult): number {
  let typeScore = 0;
  for (const type of result.types ?? []) {
    typeScore = Math.max(typeScore, GOOGLE_TYPE_SPECIFICITY[type] ?? 0);
  }

  const locationRank = GOOGLE_PRECISION_RANK[result.geometry?.location_type ?? ''] ?? 0;
  return typeScore * 10 + locationRank;
}

function addressDetailScore(address: string): number {
  return addressSpecificityScore(address);
}

function formatOsmAddressFromComponents(address?: NominatimAddress): string | null {
  if (!address) {
    return null;
  }

  const streetLine = [address.house_number, address.building, address.road]
    .filter(Boolean)
    .join(' ')
    .trim();

  const villageOrHamlet =
    address.village ||
    address.hamlet ||
    address.locality ||
    address.neighbourhood ||
    address.suburb;

  const nearbyTown =
    address.town && address.town !== villageOrHamlet ? address.town : undefined;
  const cityName =
    address.city && address.city !== villageOrHamlet && address.city !== nearbyTown
      ? address.city
      : undefined;

  const district = address.state_district || address.county;

  const parts = [
    streetLine || address.road,
    villageOrHamlet,
    nearbyTown,
    cityName,
    district && district !== villageOrHamlet ? district : undefined,
    address.state,
    address.postcode,
  ].filter((part, index, arr): part is string => !!part && arr.indexOf(part) === index);

  return parts.length ? parts.join(', ') : null;
}

function extractPrimaryLocalityFromDisplayName(displayName?: string): string | null {
  if (!displayName?.trim()) {
    return null;
  }

  const parts = displayName
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !['india', 'ind'].includes(part.toLowerCase()))
    .filter(part => !INDIAN_STATE_NAMES.has(part.toLowerCase()));

  return parts[0] ?? null;
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

  if (!parts.length) {
    return null;
  }

  const primary = parts[0];
  const rest = parts.slice(1, 5);
  return [primary, ...rest].join(', ');
}

export function cleanGoogleFormattedAddress(formatted: string): string {
  let cleaned = formatted.trim();

  // Remove Google Plus Code prefix (e.g. "P8CW+XPX ") while keeping the rest.
  cleaned = cleaned.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}\s*/i, '');

  // Drop trailing country for a cleaner label.
  cleaned = cleaned.replace(/,\s*India\s*$/i, '');

  return cleaned.trim();
}

function collectPlaceLabelsFromGoogleResults(results?: GoogleGeocodeResult[]): string[] {
  if (!results?.length) {
    return [];
  }

  const labels = new Set<string>();

  for (const result of results) {
    const fromComponents = buildGooglePlaceLabel(result.address_components);
    if (fromComponents && !looksLikeCoordinates(fromComponents)) {
      labels.add(fromComponents);
    }

    const finestPlace = extractFinestPlaceFromGoogleComponents(result.address_components);
    if (finestPlace) {
      const state = getGoogleComponent(
        result.address_components,
        'administrative_area_level_1',
      );
      const district = getGoogleComponent(
        result.address_components,
        'administrative_area_level_2',
      );
      const nearbyTown =
        getGoogleComponent(result.address_components, 'postal_town') ||
        getGoogleComponent(result.address_components, 'locality');

      const parts = [finestPlace];
      if (nearbyTown && nearbyTown.toLowerCase() !== finestPlace.toLowerCase()) {
        parts.push(nearbyTown);
      }
      if (district && !parts.some(part => part.toLowerCase() === district.toLowerCase())) {
        parts.push(district);
      }
      if (state) {
        parts.push(state);
      }
      labels.add(parts.join(', '));
    }

    const primary = extractPrimaryLocalityFromDisplayName(result.formatted_address);
    if (primary) {
      const state = getGoogleComponent(
        result.address_components,
        'administrative_area_level_1',
      );
      labels.add(state ? `${primary}, ${state}` : primary);
    }

    const formatted = result.formatted_address?.trim();
    if (formatted) {
      const cleaned = cleanGoogleFormattedAddress(formatted);
      if (cleaned) {
        labels.add(cleaned);
      }
    }
  }

  return Array.from(labels);
}

function pickBestGoogleFormattedAddress(results?: GoogleGeocodeResult[]): string | null {
  if (!results?.length) {
    return null;
  }

  const allLabels = collectPlaceLabelsFromGoogleResults(results);
  let best: { score: number; address: string } | null = null;

  for (const result of results) {
    const resultScore = scoreGoogleResult(result);
    const candidates = collectPlaceLabelsFromGoogleResults([result]);

    for (const address of candidates) {
      if (looksLikeCoordinates(address)) {
        continue;
      }

      const totalScore = resultScore + addressDetailScore(address);
      if (!best || totalScore > best.score) {
        best = { score: totalScore, address };
      }
    }
  }

  for (const address of allLabels) {
    if (looksLikeCoordinates(address) || isGenericAddress(address)) {
      continue;
    }

    const totalScore = addressDetailScore(address);
    if (!best || totalScore > best.score) {
      best = { score: totalScore, address };
    }
  }

  if (best?.address && !isGenericAddress(best.address)) {
    return best.address;
  }

  for (const address of allLabels) {
    if (!looksLikeCoordinates(address) && !isGenericAddress(address)) {
      return address;
    }
  }

  const fallback = results[0]?.formatted_address?.trim();
  return fallback ? cleanGoogleFormattedAddress(fallback) : null;
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
    region: 'in',
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

async function nominatimReverseGeocodeAtZoom(
  latitude: number,
  longitude: number,
  zoom: number,
): Promise<NominatimResponse | null> {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    zoom: String(zoom),
    addressdetails: '1',
  });

  return httpsGetJson<NominatimResponse>(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      'User-Agent': 'EmployeeManagementApp/1.0 (attendance-checkin; contact@company.local)',
    },
  );
}

function resolveOsmAddress(data: NominatimResponse): string | null {
  const primaryFromDisplay = extractPrimaryLocalityFromDisplayName(data.display_name);
  const town = data.address?.town;
  const city = data.address?.city;
  const postTown = town || city;
  const village = data.address?.village || data.address?.hamlet;

  let finestPlace =
    village ||
    (primaryFromDisplay &&
    postTown &&
    primaryFromDisplay.toLowerCase() !== postTown.toLowerCase()
      ? primaryFromDisplay
      : undefined) ||
    data.address?.locality ||
    data.address?.neighbourhood ||
    data.address?.suburb ||
    primaryFromDisplay ||
    postTown;

  const nearbyTown =
    postTown && finestPlace && postTown.toLowerCase() !== finestPlace.toLowerCase()
      ? postTown
      : undefined;
  const district = data.address?.state_district || data.address?.county;
  const state = data.address?.state;
  const postcode = data.address?.postcode;

  const streetLine = [data.address?.house_number, data.address?.building, data.address?.road]
    .filter(Boolean)
    .join(' ')
    .trim();

  const parts = [
    streetLine || data.address?.road,
    finestPlace,
    nearbyTown,
    district && district !== finestPlace ? district : undefined,
    state,
    postcode,
  ].filter((part, index, arr): part is string => !!part && arr.indexOf(part) === index);

  if (parts.length) {
    const label = parts.join(', ');
    if (!isAdminOnlyAddress(label)) {
      return label;
    }
  }

  const fromDisplay = formatOsmDisplayName(data.display_name);
  if (fromDisplay && !isAdminOnlyAddress(fromDisplay)) {
    return fromDisplay;
  }

  return parts.length ? parts.join(', ') : fromDisplay;
}

function pickBestResolvedAddress(
  googleAddress: string | null,
  osmAddress: string | null,
  latitude: number,
  longitude: number,
): string {
  const fallback = coordinateFallback(latitude, longitude);
  const candidates = [googleAddress, osmAddress].filter(
    (address): address is string =>
      !!address?.trim() && !looksLikeCoordinates(address),
  );

  if (!candidates.length) {
    return fallback;
  }

  let best: { score: number; address: string } | null = null;
  for (const address of candidates) {
    const score = addressSpecificityScore(address);
    if (!best || score > best.score) {
      best = { score, address };
    }
  }

  if (best && best.score > 0) {
    logger.info('Reverse geocode resolved', {
      latitude,
      longitude,
      address: best.address,
      score: best.score,
    });
    return best.address;
  }

  const nonAdmin = candidates.find(address => !isAdminOnlyAddress(address));
  if (nonAdmin) {
    return nonAdmin;
  }

  return fallback;
}

async function nominatimReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const zoomLevels = [18, 17, 16, 15, 14];
    const responses: NominatimResponse[] = [];

    for (const zoom of zoomLevels) {
      const data = await nominatimReverseGeocodeAtZoom(latitude, longitude, zoom);
      if (data) {
        responses.push(data);
      }
    }

    for (const data of responses) {
      if (data.address?.village || data.address?.hamlet) {
        const resolved = resolveOsmAddress(data);
        if (resolved && !isAdminOnlyAddress(resolved)) {
          return resolved;
        }
      }
    }

    for (const data of responses) {
      const primary = extractPrimaryLocalityFromDisplayName(data.display_name);
      const town = data.address?.town || data.address?.city;
      if (
        primary &&
        town &&
        primary.toLowerCase() !== town.toLowerCase()
      ) {
        const resolved = resolveOsmAddress(data);
        if (resolved && !isAdminOnlyAddress(resolved)) {
          return resolved;
        }
      }
    }

    for (const data of responses) {
      const resolved = resolveOsmAddress(data);
      if (resolved && !isAdminOnlyAddress(resolved)) {
        return resolved;
      }
    }

    const fallbackData = responses[0];
    return fallbackData ? resolveOsmAddress(fallbackData) : null;
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

  const [googleAddress, osmAddress] = await Promise.all([
    googleReverseGeocode(latitude, longitude),
    nominatimReverseGeocode(latitude, longitude),
  ]);

  return pickBestResolvedAddress(googleAddress, osmAddress, latitude, longitude);
}

export async function resolveLocationAddress(location: {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  locationTimestamp?: string;
  isMocked?: boolean;
}): Promise<{
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
  locationTimestamp?: string;
  isMocked?: boolean;
}> {
  const existingAddress = location.address?.trim();
  const resolvedAddress =
    existingAddress && !isGenericAddress(existingAddress)
      ? existingAddress
      : await reverseGeocode(location.latitude, location.longitude);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    address: resolvedAddress,
    accuracy: location.accuracy,
    locationTimestamp: location.locationTimestamp,
    isMocked: location.isMocked,
  };
}
