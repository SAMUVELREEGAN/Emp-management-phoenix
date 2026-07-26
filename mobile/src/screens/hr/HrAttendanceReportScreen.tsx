import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppInput,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  StatCard,
  WorkReportCard,
} from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, toDateInputValue } from '../../utils/dates';
import type { AttendanceRoleSummary, WorkReport } from '../../types';
import type { HrReportsStackParamList } from '../../navigation/types';

interface HrAttendanceReportScreenProps {
  embedded?: boolean;
}

export default function HrAttendanceReportScreen(_props: HrAttendanceReportScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<HrReportsStackParamList>>();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [summary, setSummary] = useState<AttendanceRoleSummary | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const reportDate = toDateInputValue();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [summaryResponse, reportsResponse] = await Promise.all([
        attendanceApi.summary(reportDate),
        workReportApi.myReports({
          page: 1,
          limit: 20,
          reportType: 'attendance_summary',
        }),
      ]);
      setSummary(summaryResponse.data.summary.employees);
      setReports(reportsResponse.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportDate]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const hasSubmittedToday = reports.some(
    report =>
      toDateInputValue(report.reportDate) === reportDate &&
      ['submitted', 'approved', 'rejected'].includes(report.status),
  );

  const handleSubmit = async () => {
    if (!summary || submitting || hasSubmittedToday) {
      return;
    }

    setSubmitting(true);
    try {
      await workReportApi.createHrAttendanceReport({
        reportDate,
        workSummary: notes.trim(),
        attendanceSummary: {
          present: summary.present,
          absent: summary.absent,
          late: summary.late,
          checkedOut: summary.checkedOut,
          activeEmployees: summary.active,
        },
        status: 'submitted',
      });
      Alert.alert(
        'Report Sent',
        'Today\'s employee attendance summary has been sent to the admin.',
      );
      setNotes('');
      fetchData(true);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorWrap}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
          }
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>Today's Employee Attendance</Text>
              <Text style={styles.dateLabel}>{formatDate(reportDate)}</Text>

              <View style={styles.statsRow}>
                <StatCard title="Present" value={summary?.present || 0} icon="check-circle-outline" />
                <StatCard
                  title="Absent"
                  value={summary?.absent || 0}
                  icon="close-circle-outline"
                  color={theme.colors.error}
                  backgroundColor={theme.colors.errorLight}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  title="Late"
                  value={summary?.late || 0}
                  icon="clock-alert-outline"
                  color={theme.colors.warning}
                  backgroundColor={theme.colors.warningLight}
                />
                <StatCard title="Checked Out" value={summary?.checkedOut || 0} icon="logout" />
              </View>

              <AppInput
                label="Notes for Admin (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Add any remarks about today's employee attendance..."
                style={styles.notesInput}
              />

              <AppButton
                title={
                  hasSubmittedToday
                    ? 'Report Already Sent Today'
                    : submitting
                      ? 'Sending Report...'
                      : 'Send Report to Admin'
                }
                onPress={handleSubmit}
                loading={submitting}
                disabled={hasSubmittedToday || submitting || !summary}
                style={styles.submitButton}
              />

              <Text style={styles.historyTitle}>Submitted Reports</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-send-outline"
              title="No reports submitted yet"
              message="Send today's attendance summary to the admin using the button above."
            />
          }
          renderItem={({ item }) => (
            <WorkReportCard
              report={item}
              onPress={() =>
                navigation.navigate('AdminWorkReportDetail', { reportId: item._id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  errorWrap: {
    padding: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  historyTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
});
