import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { theme } from '../constants/theme';
import { settingsApi } from '../api/settingsApi';
import { getErrorMessage } from '../utils/errors';
import { normalizeOfficeHours } from '../utils/officeHours';
import {
  displayValueToMinutes,
  formatReminderIntervalLabel,
  getReminderIntervalHint,
  minutesToDisplayValue,
  type ReminderIntervalUnit,
} from '../utils/reminderInterval';
import type { OfficeHours } from '../types';

interface HourlyReportReminderSettingsCardProps {
  refreshKey?: number;
  onSaved?: () => void;
}

export function HourlyReportReminderSettingsCard({
  refreshKey = 0,
  onSaved,
}: HourlyReportReminderSettingsCardProps) {
  const [settings, setSettings] = useState<OfficeHours>(normalizeOfficeHours());
  const [intervalValue, setIntervalValue] = useState('1');
  const [intervalUnit, setIntervalUnit] = useState<ReminderIntervalUnit>('hours');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const applyIntervalFromSettings = useCallback((officeHours: OfficeHours) => {
    const display = minutesToDisplayValue(
      officeHours.hourlyReportReminderIntervalMinutes ?? 60,
    );
    setIntervalValue(display.value);
    setIntervalUnit(display.unit);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settingsApi.getOfficeHours();
      const normalized = normalizeOfficeHours(response.data.officeHours);
      setSettings(normalized);
      applyIntervalFromSettings(normalized);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyIntervalFromSettings]);

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

  const handleSave = async () => {
    const intervalMinutes = displayValueToMinutes(intervalValue, intervalUnit);
    if (!intervalMinutes) {
      setError(
        intervalUnit === 'hours'
          ? 'Enter a valid interval between 0.25 and 8 hours.'
          : 'Enter a valid interval between 15 and 480 minutes.',
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await settingsApi.updateOfficeHours({
        hourlyReportReminderEnabled: settings.hourlyReportReminderEnabled,
        hourlyReportReminderIntervalMinutes: intervalMinutes,
      });
      const normalized = normalizeOfficeHours(response.data.officeHours);
      setSettings(normalized);
      applyIntervalFromSettings(normalized);
      onSaved?.();
      Alert.alert(
        'Saved',
        `Hourly report reminders will repeat every ${formatReminderIntervalLabel(
          intervalMinutes,
        )}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hourly Report Reminder</Text>
      <Text style={styles.subtitle}>
        Checked-in employees receive reminders to send hourly work reports to Admin and HR.
      </Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Enable reminders</Text>
          <Text style={styles.toggleHint}>
            Notifications start after the selected interval from check-in.
          </Text>
        </View>
        <Switch
          value={settings.hourlyReportReminderEnabled !== false}
          onValueChange={enabled =>
            setSettings(current => ({ ...current, hourlyReportReminderEnabled: enabled }))
          }
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
          thumbColor={
            settings.hourlyReportReminderEnabled !== false
              ? theme.colors.primary
              : theme.colors.textMuted
          }
        />
      </View>

      <Text style={styles.intervalLabel}>Reminder interval</Text>
      <View style={styles.intervalInputRow}>
        <AppInput
          label="Enter value"
          value={intervalValue}
          onChangeText={setIntervalValue}
          keyboardType="decimal-pad"
          placeholder={intervalUnit === 'hours' ? '1' : '60'}
        />
        <View style={styles.unitRow}>
          {(['minutes', 'hours'] as const).map(unit => {
            const selected = intervalUnit === unit;
            return (
              <Pressable
                key={unit}
                style={[styles.unitChip, selected && styles.unitChipSelected]}
                onPress={() => setIntervalUnit(unit)}>
                <Text style={[styles.unitChipText, selected && styles.unitChipTextSelected]}>
                  {unit === 'minutes' ? 'Minutes' : 'Hours'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={styles.intervalHint}>{getReminderIntervalHint(intervalUnit)}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title={saving ? 'Saving...' : 'Save Reminder Settings'}
        onPress={handleSave}
        loading={saving}
        disabled={saving || loading}
        style={styles.saveButton}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  intervalLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  intervalInputRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  unitRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  unitChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  unitChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  unitChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  unitChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  intervalHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.xs,
  },
});
