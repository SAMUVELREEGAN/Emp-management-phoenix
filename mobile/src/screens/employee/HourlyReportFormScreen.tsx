import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ErrorMessage } from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import { formatTime } from '../../utils/dates';
import type { EmployeeReportsStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

type Props = NativeStackScreenProps<EmployeeReportsStackParamList, 'HourlyReportForm'>;

export default function HourlyReportFormScreen({ route, navigation }: Props) {
  const periodStart = route.params?.periodStart;
  const periodEnd = route.params?.periodEnd ?? new Date().toISOString();
  const [workSummary, setWorkSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useStackBackTo('WorkReportList');

  const periodLabel = useMemo(() => {
    const start = periodStart ? new Date(periodStart) : new Date(periodEnd);
    const end = new Date(periodEnd);
    return `${formatTime(start)} - ${formatTime(end)}`;
  }, [periodEnd, periodStart]);

  const handleSubmit = async () => {
    const summary = workSummary.trim();
    if (!summary) {
      setError('Please describe what you worked on during this hour.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await workReportApi.createHourly({
        workSummary: summary,
        reportPeriodStart: periodStart,
        reportPeriodEnd: periodEnd,
      });
      Alert.alert(
        'Report Sent',
        'Your hourly work report has been sent to Admin and HR.',
        [{ text: 'OK', onPress: () => navigation.navigate('WorkReportList', { reportKind: 'hourly' }) }],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Hourly Work Report" showBack onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Report Period</Text>
            <Text style={styles.infoText}>{periodLabel}</Text>
            <Text style={styles.infoHint}>
              Summarize what you completed in this period. Admin and HR will be notified.
            </Text>
          </View>

          <AppInput
            label="Work Summary"
            value={workSummary}
            onChangeText={setWorkSummary}
            multiline
            numberOfLines={6}
            placeholder="Describe tasks completed, progress made, and any blockers..."
            style={styles.summaryInput}
          />

          {error ? <ErrorMessage message={error} /> : null}

          <AppButton
            title={submitting ? 'Sending...' : 'Send to Admin & HR'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  summaryInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
