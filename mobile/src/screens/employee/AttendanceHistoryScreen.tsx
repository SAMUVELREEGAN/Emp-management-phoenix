import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader, AttendanceCard, EmptyState, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { settingsApi } from '../../api/settingsApi';
import { getErrorMessage } from '../../utils/errors';
import { normalizeOfficeHours } from '../../utils/officeHours';
import type { Attendance } from '../../types';
import { useFabricSafeBack, ATTENDANCE_MAIN_ROUTE } from '../../navigation/safeStackBack';

export default function AttendanceHistoryScreen() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [officeStartTime, setOfficeStartTime] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const clearScreenState = useCallback(() => {
    setRecords([]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const { handleBack, leavingRef } = useFabricSafeBack({
    routes: ATTENDANCE_MAIN_ROUTE,
    onBeforeBack: clearScreenState,
  });

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (leavingRef.current) {
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await attendanceApi.myHistory({ page: 1, limit: 50 });
      if (!leavingRef.current) {
        setRecords(response.data.items);
      }
    } catch (err) {
      if (!leavingRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (!leavingRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  useEffect(() => {
    settingsApi
      .getOfficeHours()
      .then(response => {
        setOfficeStartTime(normalizeOfficeHours(response.data.officeHours).officeStartTime);
      })
      .catch(() => {
        setOfficeStartTime(undefined);
      });
  }, []);

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="Attendance History" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchHistory()} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="No attendance records"
              message="Your attendance history will appear here."
            />
          }
          renderItem={({ item }) => (
            <AttendanceCard attendance={item} officeStartTime={officeStartTime} />
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
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
});
