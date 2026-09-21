import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

  const remindersEnabled = settings.hourlyReportReminderEnabled !== false;

  const previewText = useMemo(() => {
    if (!remindersEnabled) {
      return 'Reminders are turned off';
    }

    const intervalMinutes = displayValueToMinutes(intervalValue, intervalUnit);
    if (!intervalMinutes) {
      return 'Set a valid reminder interval';
    }

    return `Repeats every ${formatReminderIntervalLabel(intervalMinutes)}`;
  }, [intervalUnit, intervalValue, remindersEnabled]);

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
      <View style={styles.header}>
        <Text style={styles.title}>Hourly Report Reminder</Text>
        <View style={styles.headerAccent} />
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleIconWrap}>
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Enable reminders</Text>
          <Text style={styles.toggleHint}>
            Notifications start after the selected interval from check-in.
          </Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={enabled =>
            setSettings(current => ({ ...current, hourlyReportReminderEnabled: enabled }))
          }
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
          thumbColor={remindersEnabled ? theme.colors.primary : theme.colors.textMuted}
        />
      </View>

      <View style={styles.intervalSection}>
        <Text style={styles.intervalLabel}>Reminder interval</Text>
        <View style={styles.intervalRow}>
          <View style={styles.valueInputWrap}>
            <AppInput
              label="Enter value"
              value={intervalValue}
              onChangeText={setIntervalValue}
              keyboardType="decimal-pad"
              placeholder={intervalUnit === 'hours' ? '1' : '60'}
            />
          </View>
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
      </View>

      <View style={styles.previewCard}>
        <View style={styles.previewIconWrap}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.previewContent}>
          <Text style={styles.previewLabel}>Reminder schedule</Text>
          <Text style={styles.previewValue}>{previewText}</Text>
        </View>
      </View>

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
  intervalSection: {
    marginBottom: theme.spacing.md,
  },
  intervalLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  valueInputWrap: {
    flex: 1,
  },
  unitRow: {
    width: 108,
    gap: theme.spacing.sm,
  },
  unitChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.white,
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
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.semibold,
  },
  intervalHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    lineHeight: 16,
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
  error: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.xs,
  },
});
