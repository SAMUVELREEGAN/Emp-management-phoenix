import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, StatCard, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { ShiftReport, UserSummary } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'HR' : user.fullName;
}

export default function ShiftReportDetailScreen() {
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftReportDetail'>>();
  const { reportId } = route.params;
  const role = useAuthStore(state => state.user?.role);
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ShiftReportList' }],
    index: 0,
    onBeforeBack: () => setReport(null),
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shiftApi.getReport(reportId);
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

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await shiftApi.acknowledgeReport(reportId);
      Alert.alert('Acknowledged', 'Shift report marked as reviewed.');
      fetchReport();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Shift Report" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchReport} />
        </View>
      ) : report ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.title}>{report.title}</Text>
            <StatusBadge status={report.status} />
            <Text style={styles.meta}>Submitted by {getName(report.submittedBy)}</Text>
            <Text style={styles.meta}>{formatDate(report.periodFrom)} - {formatDate(report.periodTo)}</Text>
            <Text style={styles.meta}>Created {formatDateTime(report.createdAt)}</Text>
          </View>
          <View style={styles.statsRow}>
            <StatCard title="Shifts" value={report.snapshot.totalShifts} icon="clock-outline" />
            <StatCard title="Assignments" value={report.snapshot.activeAssignments} icon="account-switch" />
            <StatCard title="Unassigned" value={report.snapshot.employeesWithoutShift} icon="account-alert-outline" />
            <StatCard title="Pending Requests" value={report.snapshot.pendingChangeRequests} icon="swap-horizontal" />
          </View>
          {report.snapshot.shiftAttendance.map(item => (
            <View key={item.shiftId} style={styles.shiftCard}>
              <Text style={styles.shiftTitle}>{item.shiftName} ({item.shiftCode})</Text>
              <Text style={styles.shiftMeta}>
                Assigned {item.assignedCount} · Present {item.present} · Late {item.late} · Absent {item.absent}
              </Text>
            </View>
          ))}
          {report.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>HR Notes</Text>
              <Text style={styles.notesText}>{report.notes}</Text>
            </View>
          ) : null}
          {role === 'admin' && report.status === 'submitted' ? (
            <AppButton title="Acknowledge Report" onPress={handleAcknowledge} loading={acknowledging} />
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  headerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  title: { fontSize: theme.fonts.sizes.lg, fontWeight: theme.fonts.weights.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  meta: { fontSize: theme.fonts.sizes.sm, color: theme.colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  shiftCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  shiftTitle: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  shiftMeta: { fontSize: theme.fonts.sizes.sm, color: theme.colors.textMuted, marginTop: 4 },
  notesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  notesLabel: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted, marginBottom: 4 },
  notesText: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
});
