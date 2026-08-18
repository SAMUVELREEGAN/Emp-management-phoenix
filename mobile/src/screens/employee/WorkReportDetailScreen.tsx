import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime, formatTime } from '../../utils/dates';
import type { WorkReport } from '../../types';
import type { EmployeeReportsStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

export default function WorkReportDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeReportsStackParamList>>();
  const route = useRoute<RouteProp<EmployeeReportsStackParamList, 'WorkReportDetail'>>();
  const { reportId } = route.params;

  const [report, setReport] = useState<WorkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { handleBack, isLeaving } = useStackBackTo('WorkReportList', {
    onBeforeBack: () => setReport(null),
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workReportApi.getById(reportId);
      setReport(response.data.report);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [fetchReport]),
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await workReportApi.submit(reportId);
      Alert.alert('Success', 'Report submitted successfully');
      fetchReport();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = report?.status === 'draft' && report?.reportType !== 'hourly_work';
  const canSubmit = report?.status === 'draft' && report?.reportType !== 'hourly_work';
  const isHourlyReport = report?.reportType === 'hourly_work';
  const periodLabel =
    isHourlyReport && report?.reportPeriodStart && report?.reportPeriodEnd
      ? `${formatTime(report.reportPeriodStart)} - ${formatTime(report.reportPeriodEnd)}`
      : null;

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title={isHourlyReport ? 'Hourly Report' : 'Report Details'}
        showBack
        onBack={handleBack}
      />
      {isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : (
        <ScrollView contentContainerStyle={styles.content} removeClippedSubviews={false}>
          {loading ? (
            <LoadingIndicator />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchReport} />
          ) : report ? (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{report.title}</Text>
                <StatusBadge status={report.status} />
              </View>
              <Text style={styles.meta}>
                {formatDate(report.reportDate)}
                {periodLabel ? ` • ${periodLabel}` : ` • ${report.workingHours} hrs`}
              </Text>

              <Section title="Work Summary" content={report.workSummary} />
              {!isHourlyReport ? (
                <>
                  <Section title="Completed Tasks" content={report.completedTasks || '-'} />
                  <Section title="Pending Tasks" content={report.pendingTasks || '-'} />
                  <Section title="Blockers" content={report.blockers || '-'} />
                  <Section title="Tomorrow Plan" content={report.tomorrowPlan || '-'} />
                </>
              ) : null}

              {report.adminComment ? (
                <Section title="Admin Comment" content={report.adminComment} />
              ) : null}

              {report.submittedAt ? (
                <Text style={styles.meta}>Submitted: {formatDateTime(report.submittedAt)}</Text>
              ) : null}

              {canEdit ? (
                <AppButton
                  title="Edit Report"
                  variant="outline"
                  onPress={() => navigation.navigate('WorkReportForm', { reportId })}
                  style={styles.button}
                />
              ) : null}
              {canSubmit ? (
                <AppButton
                  title="Submit Report"
                  onPress={handleSubmit}
                  loading={submitting}
                  style={styles.button}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  meta: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionContent: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
});
