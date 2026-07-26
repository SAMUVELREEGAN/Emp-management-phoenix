import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  AttendanceCard,
  DashboardHeader,
  DashboardMiniStat,
  ErrorMessage,
  LiveTrackingCard,
  LoadingIndicator,
  OfficeHoursSettingsCard,
  QuickAccessGrid,
  WorkReportCard,
} from '../../components';
import type { QuickAccessItem } from '../../components';
import { theme } from '../../constants/theme';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuthStore } from '../../store/authStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { getErrorMessage } from '../../utils/errors';
import type { AdminDashboardData } from '../../types';
import type { AdminTabParamList, HrTabParamList } from '../../navigation/types';

type DashboardNav = BottomTabNavigationProp<AdminTabParamList | HrTabParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const user = useAuthStore(state => state.user);
  const userRole = user?.role;
  const isHr = userRole === 'hr';
  const { unreadCount } = useUnreadNotificationCount();
  const [data, setData] = useState<AdminDashboardData | null>(null);
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
      const response = await dashboardApi.adminDashboard();
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

  const summary = data?.summary;
  const employeeSummary = summary?.employees;
  const welcomeLabel = isHr ? 'HR' : 'Admin';

  const goMore = useCallback(
    (screen: 'Tasks' | 'Leave' | 'Track' | 'Reports' | 'Notifications' | 'Profile') => {
      navigation.navigate('More', { screen });
    },
    [navigation],
  );

  const quickAccessItems = useMemo<QuickAccessItem[]>(() => {
    const items: QuickAccessItem[] = [
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
        key: 'employees',
        label: 'Employees',
        icon: 'account-group',
        color: theme.colors.purple,
        iconBg: theme.colors.purpleLight,
        onPress: () => navigation.navigate('Employees'),
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: 'chart-bar',
        color: theme.colors.warning,
        iconBg: theme.colors.warningLight,
        onPress: () => goMore('Reports'),
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
    ];

    if (isHr) {
      return items.filter(item => !['leave', 'tasks'].includes(item.key));
    }

    return items;
  }, [goMore, isHr, navigation, unreadCount]);

  const employeeCount = isHr
    ? (employeeSummary?.present || 0) + (employeeSummary?.absent || 0) + (employeeSummary?.late || 0)
    : summary?.activeStaff || summary?.totalStaff || 0;

  return (
    <View style={styles.container}>
      <DashboardHeader
        welcomeName={welcomeLabel}
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
              label="Employees"
              value={employeeCount}
              icon="account-group"
              color={theme.colors.info}
              iconBg={theme.colors.infoLight}
            />
            <DashboardMiniStat
              label="Present"
              value={employeeSummary?.present ?? summary?.presentToday ?? 0}
              icon="calendar-check"
              color={theme.colors.success}
              iconBg={theme.colors.successLight}
            />
            <DashboardMiniStat
              label="Late"
              value={employeeSummary?.late ?? summary?.lateToday ?? 0}
              icon="clock-alert-outline"
              color={theme.colors.warning}
              iconBg={theme.colors.warningLight}
            />
            <DashboardMiniStat
              label="Absent"
              value={employeeSummary?.absent ?? summary?.absentToday ?? 0}
              icon="account-remove-outline"
              color={theme.colors.error}
              iconBg={theme.colors.errorLight}
            />
          </View>

          {!isHr ? (
            <LiveTrackingCard onPress={() => goMore('Track')} />
          ) : null}

          <QuickAccessGrid items={quickAccessItems} />

          {!isHr ? <OfficeHoursSettingsCard /> : null}

          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {data?.recentAttendance.length ? (
            data.recentAttendance.map(item => (
              <AttendanceCard key={item._id} attendance={item} showEmployee />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attendance records today</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {data?.recentReports.length ? (
            data.recentReports.map(item => <WorkReportCard key={item._id} report={item} />)
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



