import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton } from './AppButton';
import { TimePickerField } from './TimePickerField';
import { theme } from '../constants/theme';
import { settingsApi } from '../api/settingsApi';
import { getErrorMessage } from '../utils/errors';
import { formatOfficeTime12Hour, parseTimeToMinutes } from '../utils/dates';
import { normalizeOfficeHours } from '../utils/officeHours';
import type { OfficeHours } from '../types';

interface OfficeHoursSettingsCardProps {
  refreshKey?: number;
  onSaved?: () => void;
}

export function OfficeHoursSettingsCard({
  refreshKey = 0,
  onSaved,
}: OfficeHoursSettingsCardProps) {
  const [officeHours, setOfficeHours] = useState<OfficeHours>({
    officeStartTime: '09:30',
    officeEndTime: '18:00',
    geofenceEnabled: false,
    geofenceRadiusMeters: 200,
    officeLocationName: 'Office',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOfficeHours = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settingsApi.getOfficeHours();
      setOfficeHours(normalizeOfficeHours(response.data.officeHours));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficeHours();
  }, [fetchOfficeHours]);

  useEffect(() => {
    if (refreshKey > 0) {
      void fetchOfficeHours();
    }
  }, [refreshKey, fetchOfficeHours]);

  useFocusEffect(
    useCallback(() => {
      void fetchOfficeHours();
    }, [fetchOfficeHours]),
  );

  const handleSave = async () => {
    if (
      parseTimeToMinutes(officeHours.officeStartTime) >=
      parseTimeToMinutes(officeHours.officeEndTime)
    ) {
      Alert.alert('Invalid Time', 'Office start time must be before office end time.');
      return;
    }

    setSaving(true);
    try {
      const response = await settingsApi.updateOfficeHours({
        officeStartTime: officeHours.officeStartTime,
        officeEndTime: officeHours.officeEndTime,
      });
      setOfficeHours(normalizeOfficeHours(response.data.officeHours));
      onSaved?.();
      Alert.alert('Saved', 'Office hours updated successfully.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Office Hours</Text>
        <View style={styles.headerAccent} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.timeRow}>
        <TimePickerField
          label="Office Start Time"
          value={officeHours.officeStartTime}
          onChange={officeStartTime =>
            setOfficeHours(current => ({ ...current, officeStartTime }))
          }
          disabled={disabled}
          variant="surface"
          containerStyle={styles.timeField}
        />
        <TimePickerField
          label="Office End Time"
          value={officeHours.officeEndTime}
          onChange={officeEndTime => setOfficeHours(current => ({ ...current, officeEndTime }))}
          disabled={disabled}
          variant="surface"
          containerStyle={styles.timeField}
        />
      </View>

      <View style={styles.previewCard}>
        <View style={styles.previewIconWrap}>
          <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.previewContent}>
          <Text style={styles.previewLabel}>Current schedule</Text>
          <Text style={styles.previewValue}>
            {formatOfficeTime12Hour(officeHours.officeStartTime)} –{' '}
            {formatOfficeTime12Hour(officeHours.officeEndTime)}
          </Text>
        </View>
      </View>

      <AppButton
        title={saving ? 'Saving...' : 'Save Office Hours'}
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
  timeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  timeField: {
    flex: 1,
    marginBottom: 0,
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
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
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
