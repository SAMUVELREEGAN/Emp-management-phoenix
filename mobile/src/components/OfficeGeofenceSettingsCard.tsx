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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { theme } from '../constants/theme';
import { settingsApi } from '../api/settingsApi';
import { getErrorMessage } from '../utils/errors';
import { getCurrentLocation, requestLocationPermission } from '../utils/location';
import { DEFAULT_OFFICE_HOURS, normalizeOfficeHours } from '../utils/officeHours';
import { useAuthStore } from '../store/authStore';
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

function formatRadiusLabel(option: number): string {
  return option >= 1000 ? `${option / 1000} km` : `${option} m`;
}

interface OfficeGeofenceSettingsCardProps {
  refreshKey?: number;
  onSaved?: () => void;
}

export function OfficeGeofenceSettingsCard({
  refreshKey = 0,
  onSaved,
}: OfficeGeofenceSettingsCardProps) {
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
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

  useEffect(() => {
    if (refreshKey > 0) {
      void fetchSettings();
    }
  }, [refreshKey, fetchSettings]);

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
        geofenceEnabled: !!settings.geofenceEnabled,
        officeLatitude: settings.officeLatitude,
        officeLongitude: settings.officeLongitude,
        geofenceRadiusMeters: settings.geofenceRadiusMeters ?? 200,
        officeLocationName: settings.officeLocationName ?? '',
      });
      const saved = normalizeOfficeHours(response.data.officeHours);
      setSettings(saved);
      onSaved?.();
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
      <View style={styles.header}>
        <Text style={styles.title}>Office Geofence</Text>
        <View style={styles.headerAccent} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.toggleCard}>
        <View style={styles.toggleIconWrap}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Enable geofence</Text>
          <Text style={styles.toggleHint}>
            When enabled, check-in/out outside the radius is blocked.
          </Text>
        </View>
        <Switch
          value={!!settings.geofenceEnabled}
          onValueChange={geofenceEnabled => updateSettings({ geofenceEnabled })}
          disabled={disabled}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
          thumbColor={settings.geofenceEnabled ? theme.colors.primary : theme.colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <AppInput
          label="Office location name"
          value={settings.officeLocationName || ''}
          onChangeText={officeLocationName => updateSettings({ officeLocationName })}
          placeholder="e.g. Head Office, Salem"
          editable={!disabled}
        />
      </View>

      <View style={styles.section}>
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
                  {formatRadiusLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        {!isLoggingOut ? (
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
                  fillColor="rgba(255, 215, 0, 0.18)"
                  strokeWidth={2}
                />
              </>
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-outline" size={28} color={theme.colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.previewCard}>
        <View style={styles.previewIconWrap}>
          <MaterialCommunityIcons
            name={hasOfficeCoords ? 'crosshairs-gps' : 'map-search-outline'}
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.previewContent}>
          <Text style={styles.previewLabel}>
            {hasOfficeCoords ? 'Office location' : 'Location status'}
          </Text>
          {hasOfficeCoords ? (
            <>
              <Text style={styles.previewValue}>
                {settings.officeLocationName || 'Office'} · {formatRadiusLabel(radius)}
              </Text>
              <Text style={styles.previewCoords}>
                {settings.officeLatitude!.toFixed(6)}, {settings.officeLongitude!.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.previewValue}>
              Tap the map or use your current location to set office.
            </Text>
          )}
        </View>
      </View>

      <AppButton
        title={saving ? 'Saving...' : 'Save Geofence Settings'}
        onPress={handleSave}
        loading={saving}
        disabled={loading}
        style={styles.saveButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerAccent: {
    width: 36,
    height: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  toggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  toggleHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  radiusChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#F8FAFC',
    minWidth: 58,
    alignItems: 'center',
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
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.semibold,
  },
  locationButton: {
    marginBottom: theme.spacing.lg,
  },
  mapWrap: {
    height: 220,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFF0B3',
  },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  previewValue: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    lineHeight: 20,
  },
  previewCoords: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  saveButton: {
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.md,
  },
});
