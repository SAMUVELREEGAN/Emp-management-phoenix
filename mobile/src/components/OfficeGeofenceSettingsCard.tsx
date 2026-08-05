import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { theme } from '../constants/theme';
import { settingsApi } from '../api/settingsApi';
import { getErrorMessage } from '../utils/errors';
import { getCurrentLocation, requestLocationPermission } from '../utils/location';
import { DEFAULT_OFFICE_HOURS, normalizeOfficeHours } from '../utils/officeHours';
import type { OfficeHours } from '../types';

const RADIUS_OPTIONS = [50, 100, 200, 500, 1000, 2000];

function toRegion(latitude: number, longitude: number, radiusMeters: number): Region {
  const delta = Math.max(radiusMeters / 111_000, 0.002) * 2.5;
  return {
    latitude,
    longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function OfficeGeofenceSettingsCard() {
  const [settings, setSettings] = useState<OfficeHours>(DEFAULT_OFFICE_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settingsApi.getOfficeHours();
      setSettings(normalizeOfficeHours(response.data.officeHours));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useFocusEffect(
    useCallback(() => {
      void fetchSettings();
    }, [fetchSettings]),
  );

  const updateSettings = (patch: Partial<OfficeHours>) => {
    setSettings(current => ({ ...current, ...patch }));
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Permission required', 'Location permission is needed to set office location.');
        return;
      }

      const location = await getCurrentLocation();
      updateSettings({
        officeLatitude: location.latitude,
        officeLongitude: location.longitude,
      });
    } catch (err) {
      Alert.alert('Location error', getErrorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (settings.geofenceEnabled) {
      if (settings.officeLatitude == null || settings.officeLongitude == null) {
        Alert.alert(
          'Office location required',
          'Set the office location on the map or tap "Use My Current Location".',
        );
        return;
      }
    }

    setSaving(true);
    try {
      const response = await settingsApi.updateOfficeHours({
        officeStartTime: settings.officeStartTime,
        officeEndTime: settings.officeEndTime,
        geofenceEnabled: !!settings.geofenceEnabled,
        officeLatitude: settings.officeLatitude,
        officeLongitude: settings.officeLongitude,
        geofenceRadiusMeters: settings.geofenceRadiusMeters ?? 200,
        officeLocationName: settings.officeLocationName ?? '',
      });
      const saved = response.data.officeHours;
      setSettings(normalizeOfficeHours({ ...settings, ...saved }));
      Alert.alert('Saved', 'Geofence settings updated successfully.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const radius = settings.geofenceRadiusMeters ?? 200;
  const hasOfficeCoords =
    settings.officeLatitude != null && settings.officeLongitude != null;

  const mapRegion = useMemo(
    () =>
      hasOfficeCoords
        ? toRegion(settings.officeLatitude!, settings.officeLongitude!, radius)
        : {
            latitude: 11.1271,
            longitude: 78.6569,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          },
    [hasOfficeCoords, settings.officeLatitude, settings.officeLongitude, radius],
  );

  const [region, setRegion] = useState(mapRegion);

  useEffect(() => {
    setRegion(mapRegion);
  }, [mapRegion]);

  const mapKey = hasOfficeCoords
    ? `${settings.officeLatitude}-${settings.officeLongitude}-${radius}-${settings.geofenceEnabled}`
    : 'geofence-empty';

  const disabled = loading || saving;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Office Geofence</Text>
      <Text style={styles.subtitle}>
        Set the office location and allowed radius. Employees and HR can check in and check out
        only inside this area.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>Enable geofence</Text>
          <Text style={styles.switchHint}>
            When enabled, check-in/out outside the radius is blocked.
          </Text>
        </View>
        <Switch
          value={!!settings.geofenceEnabled}
          onValueChange={geofenceEnabled => updateSettings({ geofenceEnabled })}
          disabled={disabled}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
          thumbColor={settings.geofenceEnabled ? theme.colors.primary : theme.colors.white}
        />
      </View>

      <AppInput
        label="Office location name"
        value={settings.officeLocationName || ''}
        onChangeText={officeLocationName => updateSettings({ officeLocationName })}
        placeholder="e.g. Head Office, Salem"
        editable={!disabled}
      />

      <Text style={styles.fieldLabel}>Allowed radius</Text>
      <View style={styles.radiusRow}>
        {RADIUS_OPTIONS.map(option => {
          const selected = radius === option;
          return (
            <Pressable
              key={option}
              style={[styles.radiusChip, selected && styles.radiusChipSelected]}
              onPress={() => updateSettings({ geofenceRadiusMeters: option })}
              disabled={disabled}>
              <Text style={[styles.radiusChipText, selected && styles.radiusChipTextSelected]}>
                {option >= 1000 ? `${option / 1000} km` : `${option} m`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        title={locating ? 'Detecting location...' : 'Use My Current Location'}
        variant="outline"
        onPress={handleUseMyLocation}
        loading={locating}
        disabled={disabled || locating}
        style={styles.locationButton}
      />

      <View style={styles.mapWrap}>
        <MapView
          key={mapKey}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={event => {
            if (disabled) {
              return;
            }
            const { latitude, longitude } = event.nativeEvent.coordinate;
            updateSettings({ officeLatitude: latitude, officeLongitude: longitude });
          }}>
          {hasOfficeCoords ? (
            <>
              <Marker
                coordinate={{
                  latitude: settings.officeLatitude!,
                  longitude: settings.officeLongitude!,
                }}
                title={settings.officeLocationName || 'Office'}
                draggable
                onDragEnd={event => {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  updateSettings({ officeLatitude: latitude, officeLongitude: longitude });
                }}
              />
              <Circle
                center={{
                  latitude: settings.officeLatitude!,
                  longitude: settings.officeLongitude!,
                }}
                radius={radius}
                strokeColor={theme.colors.primary}
                fillColor="rgba(37, 99, 235, 0.15)"
                strokeWidth={2}
              />
            </>
          ) : null}
        </MapView>
      </View>

      {hasOfficeCoords ? (
        <Text style={styles.coordsText}>
          Office: {settings.officeLatitude!.toFixed(6)}, {settings.officeLongitude!.toFixed(6)}
          {'\n'}Radius: {radius} meters
        </Text>
      ) : (
        <Text style={styles.coordsHint}>Tap the map or use your current location to set office.</Text>
      )}

      <AppButton
        title={saving ? 'Saving...' : 'Save Geofence Settings'}
        onPress={handleSave}
        loading={saving}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  switchHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  radiusChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
  },
  radiusChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  radiusChipText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  radiusChipTextSelected: {
    color: theme.colors.primary,
  },
  locationButton: {
    marginBottom: theme.spacing.md,
  },
  mapWrap: {
    height: 220,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    flex: 1,
  },
  coordsText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  coordsHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.warning,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.sm,
  },
});
