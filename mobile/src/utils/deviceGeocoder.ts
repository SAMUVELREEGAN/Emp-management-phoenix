import { NativeModules, Platform } from 'react-native';

type DeviceGeocoderResult = {
  address?: string;
  featureName?: string;
  subLocality?: string;
  locality?: string;
  subAdminArea?: string;
  adminArea?: string;
  postalCode?: string;
  thoroughfare?: string;
};

type DeviceGeocoderModule = {
  reverseGeocode: (
    latitude: number,
    longitude: number,
  ) => Promise<DeviceGeocoderResult | null>;
};

const nativeModule = NativeModules.DeviceGeocoder as DeviceGeocoderModule | undefined;

export async function reverseGeocodeOnDevice(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (Platform.OS !== 'android' || !nativeModule?.reverseGeocode) {
    return null;
  }

  try {
    const result = await nativeModule.reverseGeocode(latitude, longitude);
    const address = result?.address?.trim();
    return address || null;
  } catch {
    return null;
  }
}
