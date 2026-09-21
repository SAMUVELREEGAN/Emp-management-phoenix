import React, { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollPolicy } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';

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

function PolicySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <MaterialCommunityIcons name={icon} size={20} color={theme.colors.accent} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
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

export default function PayrollPolicySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const [policy, setPolicy] = useState<PayrollPolicy>(defaultPolicy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

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

  const handleBack = useCallback(() => {
    if (isLeaving) {
      return;
    }
    setIsLeaving(true);
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('AdminSalaryRoster');
          }
        }, 120);
      });
    });
  }, [isLeaving, navigation]);

  useFocusEffect(
    useCallback(() => {
      setIsLeaving(false);
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
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
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Payroll Policy"
        subtitle="Configure salary calculation rules"
        showBack
        onBack={handleBack}
      />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchPolicy} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <PolicySection title="Working Days" icon="calendar-month-outline">
              <AppInput
                label="Standard Working Days / Month"
                value={String(policy.standardWorkingDaysPerMonth)}
                onChangeText={value => updateField('standardWorkingDaysPerMonth', Number(value) || 0)}
                keyboardType="numeric"
              />
            </PolicySection>

            <PolicySection title="Late Deductions" icon="clock-alert-outline">
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
            </PolicySection>

            <PolicySection title="Leave & Overtime" icon="calendar-clock-outline">
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
            </PolicySection>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <MaterialCommunityIcons name="tune" size={20} color={theme.colors.accent} />
                </View>
                <Text style={styles.sectionTitle}>Policy Toggles</Text>
              </View>
              <ToggleRow
                label="Enable leave deductions"
                value={policy.leaveDeductionEnabled}
                onValueChange={value => updateField('leaveDeductionEnabled', value)}
              />
              <View style={styles.toggleDivider} />
              <ToggleRow
                label="Enable overtime pay"
                value={policy.overtimeEnabled}
                onValueChange={value => updateField('overtimeEnabled', value)}
              />
              <View style={styles.toggleDivider} />
              <ToggleRow
                label="Pro-rata for joining/exit"
                value={policy.proRataJoiningExit}
                onValueChange={value => updateField('proRataJoiningExit', value)}
              />
            </View>

            <AppButton
              title="Save Payroll Policy"
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  toggleLabel: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    paddingRight: theme.spacing.md,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  saveBtn: {
    marginTop: theme.spacing.xs,
  },
});
