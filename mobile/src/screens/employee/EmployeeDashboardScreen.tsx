import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  AttendanceCard,
  DashboardHeader,
  DashboardMiniStat,
  ErrorMessage,
  LoadingIndicator,
  QuickAccessGrid,
  WorkReportCard,
} from '../../components';
import type { QuickAccessItem } from '../../components';
import { theme } from '../../constants/theme';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuthStore } from '../../store/authStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeDashboardData } from '../../types';
import type { EmployeeTabParamList } from '../../navigation/types';

export default function EmployeeDashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<EmployeeTabParamList>>();
  const user = useAuthStore(state => state.user);
  const { unreadCount } = useUnreadNotificationCount();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await dashboardApi.employeeDashboard();
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const presentCount =
    data?.attendanceSummary.find(item => item._id === 'present')?.count || 0;
  const lateCount = data?.attendanceSummary.find(item => item._id === 'late')?.count || 0;
  const absentCount = data?.attendanceSummary.find(item => item._id === 'absent')?.count || 0;
  const totalDays = presentCount + lateCount + absentCount;

  const goMore = useCallback(
    (screen: 'Tasks' | 'Leave' | 'Notifications' | 'Profile') => {
      navigation.navigate('More', { screen });
    },
    [navigation],
  );

  const quickAccessItems = useMemo<QuickAccessItem[]>(
    () => [
      {
        key: 'attendance',
        label: 'Attendance',
        icon: 'calendar-clock',
        color: theme.colors.info,
        iconBg: theme.colors.infoLight,
        onPress: () => navigation.navigate('Attendance'),
      },
      {
        key: 'leave',
        label: 'Leave',
        icon: 'calendar-plus',
        color: theme.colors.success,
        iconBg: theme.colors.successLight,
        onPress: () => goMore('Leave'),
      },
      {
        key: 'tasks',
        label: 'Tasks',
        icon: 'clipboard-list-outline',
        color: theme.colors.info,
        iconBg: theme.colors.infoLight,
        onPress: () => goMore('Tasks'),
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: 'chart-bar',
        color: theme.colors.warning,
        iconBg: theme.colors.warningLight,
        onPress: () => navigation.navigate('Reports'),
      },
      {
        key: 'chat',
        label: 'Chat',
        icon: 'chat-outline',
        color: theme.colors.purple,
        iconBg: theme.colors.purpleLight,
        onPress: () => navigation.navigate('Chat'),
      },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: 'bell-outline',
        color: theme.colors.error,
        iconBg: theme.colors.errorLight,
        badge: unreadCount,
        onPress: () => goMore('Notifications'),
      },
    ],
    [goMore, navigation, unreadCount],
  );

  const firstName = user?.fullName?.split(' ')[0] || 'Employee';

  return (
    <View style={styles.container}>
      <DashboardHeader
        welcomeName={firstName}
        unreadCount={unreadCount}
        onMenuPress={() => goMore('Profile')}
        onNotificationsPress={() => goMore('Notifications')}
      />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} />
          }>
          {error ? <ErrorMessage message={error} onRetry={() => fetchDashboard()} /> : null}

          <View style={styles.statsRow}>
            <DashboardMiniStat
              label="Days"
              value={totalDays}
              icon="calendar-range"
              color={theme.colors.info}
              iconBg={theme.colors.infoLight}
            />
            <DashboardMiniStat
              label="Present"
              value={presentCount}
              icon="calendar-check"
              color={theme.colors.success}
              iconBg={theme.colors.successLight}
            />
            <DashboardMiniStat
              label="Late"
              value={lateCount}
              icon="clock-alert-outline"
              color={theme.colors.warning}
              iconBg={theme.colors.warningLight}
            />
            <DashboardMiniStat
              label="Absent"
              value={absentCount}
              icon="account-remove-outline"
              color={theme.colors.error}
              iconBg={theme.colors.errorLight}
            />
          </View>

          <QuickAccessGrid items={quickAccessItems} />

          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          {data?.todayAttendance ? (
            <AttendanceCard attendance={data.todayAttendance} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attendance marked today</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Today's Report</Text>
          {data?.todayReport ? (
            <WorkReportCard report={data.todayReport} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No report for today</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {data?.recentReports.length ? (
            data.recentReports.map(report => (
              <WorkReportCard key={report._id} report={report} />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No recent reports</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: -theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
});
