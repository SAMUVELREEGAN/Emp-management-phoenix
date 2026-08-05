import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
      <Text style={styles.title}>Office Hours</Text>
      <Text style={styles.subtitle}>
        Tap to select start and end times in 12-hour format. Check-in after start time is marked
        late. Early check-out requires a remark.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TimePickerField
        label="Office Start Time"
        value={officeHours.officeStartTime}
        onChange={officeStartTime =>
          setOfficeHours(current => ({ ...current, officeStartTime }))
        }
        disabled={disabled}
      />
      <TimePickerField
        label="Office End Time"
        value={officeHours.officeEndTime}
        onChange={officeEndTime => setOfficeHours(current => ({ ...current, officeEndTime }))}
        disabled={disabled}
      />

      <Text style={styles.preview}>
        Current schedule: {formatOfficeTime12Hour(officeHours.officeStartTime)} to{' '}
        {formatOfficeTime12Hour(officeHours.officeEndTime)}
      </Text>

      <AppButton
        title={saving ? 'Saving...' : 'Save Office Hours'}
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
  preview: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.sm,
  },
});
