import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  AppHeader,
  DatePickerField,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  StatCard,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { ShiftAttendanceData } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';
import { toDateInputValue } from '../../utils/shift';
import { formatTime } from '../../utils/dates';

export default function ShiftAttendanceScreen() {
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftAttendance'>>();
  const { shiftId, shiftName } = route.params;
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'ShiftDetail', params: { shiftId } }], index: 0 });

  const [date, setDate] = useState(toDateInputValue());
  const [data, setData] = useState<ShiftAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await shiftApi.getShiftAttendance(shiftId, date);
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shiftId, date]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Shift Attendance" subtitle={shiftName} showBack onBack={handleBack} />
      <View style={styles.filter}>
        <DatePickerField label="Date" value={date} onChange={setDate} />
      </View>
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : data ? (
        <FlatList
          data={data.employees}
          keyExtractor={item => item.employee._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              <StatCard title="Assigned" value={data.summary.assignedCount} icon="account-group" />
              <StatCard title="Present" value={data.summary.present} icon="check-circle-outline" />
              <StatCard title="Late" value={data.summary.late} icon="clock-alert-outline" />
              <StatCard title="Absent" value={data.summary.absent} icon="close-circle-outline" />
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.employee.fullName}</Text>
                <Text style={styles.meta}>{item.employee.employeeId}</Text>
                {item.attendance?.checkInTime ? (
                  <Text style={styles.meta}>
                    In {formatTime(item.attendance.checkInTime)}
                    {item.attendance.checkOutTime ? ` · Out ${formatTime(item.attendance.checkOutTime)}` : ''}
                  </Text>
                ) : null}
              </View>
              <StatusBadge status={item.status} />
            </View>
          )}
          ListEmptyComponent={<EmptyState title="No employees" message="No employees are assigned to this shift." />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  filter: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  rowText: { flex: 1 },
  name: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  meta: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted, marginTop: 2 },
});
