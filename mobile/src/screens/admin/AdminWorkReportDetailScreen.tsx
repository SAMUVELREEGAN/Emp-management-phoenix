import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
  GeoCamPhotoSection,
} from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime, formatTime } from '../../utils/dates';
import type { UserSummary, WorkReport } from '../../types';
import type { AdminReportsStackParamList, HrReportsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

type ReportDetailStack = AdminReportsStackParamList | HrReportsStackParamList;

function getEmployeeName(employee: UserSummary | string): string {
  if (typeof employee === 'string') {
    return 'Employee';
  }
  return `${employee.fullName} (${employee.employeeId})`;
}

export default function AdminWorkReportDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ReportDetailStack>>();
  const route = useRoute<RouteProp<ReportDetailStack, 'AdminWorkReportDetail'>>();
  const { reportId } = route.params;
  const user = useAuthStore(state => state.user);

  const listRoute = navigation.getState().routeNames.includes('HrReportsMain')
    ? 'HrReportsMain'
    : 'AdminWorkReportList';

  const { handleBack, isLeaving } = useFabricSafeBack({
    routes: [{ name: listRoute }],
    index: 0,
    delayMs: 560,
    onBeforeBack: () => setReport(null),
  });

  const [report, setReport] = useState<WorkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset } = useForm<{ adminComment: string }>({
    defaultValues: { adminComment: '' },
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workReportApi.getById(reportId);
      setReport(response.data.report);
      reset({ adminComment: response.data.report.adminComment || '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [reportId, reset]);

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [fetchReport]),
  );

  const handleReview = async (status: 'approved' | 'rejected', adminComment: string) => {
    setReviewing(true);
    try {
      await workReportApi.review(reportId, { status, adminComment: adminComment.trim() });
      Alert.alert('Success', `Report ${status} successfully`, [
        { text: 'OK', onPress: () => handleBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  const reportOwnerId =
    report && typeof report.employee === 'object'
      ? report.employee._id
      : typeof report?.employee === 'string'
        ? report.employee
        : undefined;
  const isOwnReport = !!user?._id && reportOwnerId === user._id;
  const canReview =
    report?.status === 'submitted' &&
    !(user?.role === 'hr' && isOwnReport) &&
    !isHourlyReport;
  const isAttendanceSummary = report?.reportType === 'attendance_summary';
  const isHourlyReport = report?.reportType === 'hourly_work';
  const periodLabel =
    isHourlyReport && report?.reportPeriodStart && report?.reportPeriodEnd
      ? `${formatTime(report.reportPeriodStart)} - ${formatTime(report.reportPeriodEnd)}`
      : null;

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title={isHourlyReport ? 'Hourly Report' : 'Review Report'}
        showBack
        onBack={handleBack}
      />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchReport} />
        </View>
      ) : report ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{report.title}</Text>
            <StatusBadge status={report.status} />
          </View>
          <Text style={styles.meta}>{getEmployeeName(report.employee)}</Text>
          <Text style={styles.meta}>
            {formatDate(report.reportDate)}
            {periodLabel
              ? ` • ${periodLabel}`
              : !isAttendanceSummary
                ? ` • ${report.workingHours} hrs`
                : ''}
          </Text>

          {isHourlyReport ? (
            <View style={styles.hourlyNote}>
              <Text style={styles.hourlyNoteText}>
                GeoCam hourly field report with photo and GPS location.
              </Text>
            </View>
          ) : null}

          {isHourlyReport ? <GeoCamPhotoSection report={report} /> : null}

          {isAttendanceSummary && report.attendanceSummary ? (
            <View style={styles.summaryGrid}>
              <SummaryStat label="Active Employees" value={report.attendanceSummary.activeEmployees} />
              <SummaryStat label="Present" value={report.attendanceSummary.present} />
              <SummaryStat label="Absent" value={report.attendanceSummary.absent} />
              <SummaryStat label="Late" value={report.attendanceSummary.late} />
              <SummaryStat label="Checked Out" value={report.attendanceSummary.checkedOut} />
            </View>
          ) : null}

          <Section
            title={isAttendanceSummary ? 'Notes' : 'Work Summary'}
            content={report.workSummary}
          />
          {!isAttendanceSummary && !isHourlyReport ? (
            <>
              <Section title="Completed Tasks" content={report.completedTasks || '-'} />
              <Section title="Pending Tasks" content={report.pendingTasks || '-'} />
              <Section title="Blockers" content={report.blockers || '-'} />
              <Section title="Tomorrow Plan" content={report.tomorrowPlan || '-'} />
            </>
          ) : null}

          {report.submittedAt ? (
            <Text style={styles.meta}>Submitted: {formatDateTime(report.submittedAt)}</Text>
          ) : null}

          {canReview ? (
            <>
              <Controller
                control={control}
                name="adminComment"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Admin Comment"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                    style={styles.multiline}
                  />
                )}
              />
              <AppButton
                title="Approve"
                onPress={handleSubmit(values => handleReview('approved', values.adminComment))}
                loading={reviewing}
                style={styles.button}
              />
              <AppButton
                title="Reject"
                variant="danger"
                onPress={handleSubmit(values => handleReview('rejected', values.adminComment))}
                loading={reviewing}
                style={styles.button}
              />
            </>
          ) : report.adminComment ? (
            <Section title="Admin Comment" content={report.adminComment} />
          ) : null}
        </ScrollView>
      ) : null}
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

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
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
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { marginTop: theme.spacing.sm },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  summaryStat: {
    width: '31%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  hourlyNote: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.infoLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  hourlyNoteText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.info,
    lineHeight: 20,
  },
});
