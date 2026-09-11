import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollPolicy } from '../../types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

const defaultPolicy: PayrollPolicy = {
  standardWorkingDaysPerMonth: 26,
  weeklyOffDays: [0],
  lateDeductionPerDay: 0,
  lateDeductionPerMinute: 0,
  leaveDeductionEnabled: true,
  halfDayLeaveFactor: 0.5,
  overtimeEnabled: true,
  overtimeMultiplier: 1.5,
  overtimeHourlyDivisor: 8,
  proRataJoiningExit: true,
};

export default function PayrollPolicySettingsScreen() {
  const [policy, setPolicy] = useState<PayrollPolicy>(defaultPolicy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'AdminSalaryRoster' }], index: 0 });

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await payrollApi.getPolicy();
      setPolicy(response.data.policy);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPolicy();
    }, [fetchPolicy]),
  );

  const updateField = <K extends keyof PayrollPolicy>(key: K, value: PayrollPolicy[K]) => {
    setPolicy(current => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await payrollApi.updatePolicy({
        standardWorkingDaysPerMonth: Number(policy.standardWorkingDaysPerMonth),
        weeklyOffDays: policy.weeklyOffDays,
        lateDeductionPerDay: Number(policy.lateDeductionPerDay),
        lateDeductionPerMinute: Number(policy.lateDeductionPerMinute),
        leaveDeductionEnabled: policy.leaveDeductionEnabled,
        halfDayLeaveFactor: Number(policy.halfDayLeaveFactor),
        overtimeEnabled: policy.overtimeEnabled,
        overtimeMultiplier: Number(policy.overtimeMultiplier),
        overtimeHourlyDivisor: Number(policy.overtimeHourlyDivisor),
        proRataJoiningExit: policy.proRataJoiningExit,
      });
      setPolicy(response.data.policy);
      Alert.alert('Saved', 'Payroll policy updated successfully.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Payroll Policy"
        subtitle="Configure salary calculation rules"
        showBack
        onBack={handleBack}
      />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchPolicy} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Working Days</Text>
          <AppInput
            label="Standard Working Days / Month"
            value={String(policy.standardWorkingDaysPerMonth)}
            onChangeText={value => updateField('standardWorkingDaysPerMonth', Number(value) || 0)}
            keyboardType="numeric"
          />

          <Text style={styles.section}>Late Deductions</Text>
          <AppInput
            label="Late Deduction Per Day (INR)"
            value={String(policy.lateDeductionPerDay)}
            onChangeText={value => updateField('lateDeductionPerDay', Number(value) || 0)}
            keyboardType="numeric"
          />
          <AppInput
            label="Late Deduction Per Minute (INR)"
            value={String(policy.lateDeductionPerMinute)}
            onChangeText={value => updateField('lateDeductionPerMinute', Number(value) || 0)}
            keyboardType="numeric"
          />

          <Text style={styles.section}>Leave & Overtime</Text>
          <AppInput
            label="Half-day Leave Factor (0-1)"
            value={String(policy.halfDayLeaveFactor)}
            onChangeText={value => updateField('halfDayLeaveFactor', Number(value) || 0)}
            keyboardType="decimal-pad"
          />
          <AppInput
            label="Overtime Multiplier"
            value={String(policy.overtimeMultiplier)}
            onChangeText={value => updateField('overtimeMultiplier', Number(value) || 1)}
            keyboardType="decimal-pad"
          />
          <AppInput
            label="Hours Per Day (for OT rate)"
            value={String(policy.overtimeHourlyDivisor)}
            onChangeText={value => updateField('overtimeHourlyDivisor', Number(value) || 8)}
            keyboardType="numeric"
          />

          <ToggleRow
            label="Enable leave deductions"
            value={policy.leaveDeductionEnabled}
            onValueChange={value => updateField('leaveDeductionEnabled', value)}
          />
          <ToggleRow
            label="Enable overtime pay"
            value={policy.overtimeEnabled}
            onValueChange={value => updateField('overtimeEnabled', value)}
          />
          <ToggleRow
            label="Pro-rata for joining/exit"
            value={policy.proRataJoiningExit}
            onValueChange={value => updateField('proRataJoiningExit', value)}
          />

          <AppButton title="Save Payroll Policy" onPress={handleSave} loading={saving} />
        </ScrollView>
      )}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
        thumbColor={value ? theme.colors.primary : theme.colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  section: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  toggleLabel: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    paddingRight: theme.spacing.md,
  },
});
