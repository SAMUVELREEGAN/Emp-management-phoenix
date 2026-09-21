import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  AttendanceCard,
  DashboardHeader,
  DashboardMiniStat,
  ErrorMessage,
  LoadingIndicator,
  MonthlyAttendanceSummaryCard,
  QuickAccessGrid,
  WorkReportCard,
} from '../../components';
import type { QuickAccessItem } from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { dashboardApi } from '../../api/dashboardApi';
import { onboardingApi } from '../../api/onboardingApi';
import { useAuthStore } from '../../store/authStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeDashboardData, MonthlyAttendanceSummary } from '../../types';
import type { EmployeeTabParamList } from '../../navigation/types';
import { RETURN_TO_HOME_PARAMS, navigateHomeNestedScreen, navigateHomeScreen } from '../../navigation/dashboardNavigation';

export default function EmployeeDashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<EmployeeTabParamList>>();
  const rootNavigation = navigation as NavigationProp<ParamListBase>;
  const user = useAuthStore(state => state.user);
  const { unreadCount } = useUnreadNotificationCount();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyAttendanceSummary | null>(null);
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
      const [dashboardResponse, monthlyResponse] = await Promise.all([
        dashboardApi.employeeDashboard(),
        attendanceApi.myMonthlySummary(),
      ]);
      setData(dashboardResponse.data);
      setMonthlySummary(monthlyResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const statusResponse = await onboardingApi.status();
          if (statusResponse.data.needsOnboarding) {
            rootNavigation.navigate('Home', {
              screen: 'Payroll',
              params: { screen: 'EmployeeOnboarding' },
            });
            return;
          }
        } catch {
          // Continue to dashboard if onboarding status cannot be loaded.
        }
        fetchDashboard();
      };
      void init();
    }, [fetchDashboard, rootNavigation]),
  );

  const currentMonth = monthlySummary?.currentMonth;
  const presentCount = currentMonth?.present ?? 0;
  const lateCount = currentMonth?.late ?? 0;
  const absentCount = currentMonth?.absent ?? 0;
  const totalDays = currentMonth?.totalMarked ?? 0;

  const openQuickAccess = useCallback(
    (screen: 'Tasks' | 'Leave' | 'Notifications' | 'Profile') => {
      if (screen === 'Notifications') {
        navigateHomeScreen(rootNavigation, 'Notifications', RETURN_TO_HOME_PARAMS);
        return;
      }

      const nestedScreens: Record<'Tasks' | 'Leave' | 'Profile', string> = {
        Tasks: 'MyTasks',
        Leave: 'LeaveList',
        Profile: 'ProfileMain',
      };

      navigateHomeNestedScreen(
        rootNavigation,
        screen,
        nestedScreens[screen],
        RETURN_TO_HOME_PARAMS,
      );
    },
    [rootNavigation],
  );

  const quickAccessItems = useMemo<QuickAccessItem[]>(
    () => [
      {
        key: 'attendance',
        label: 'Attendance',
        icon: 'calendar-clock',
        color: theme.colors.info,
        iconBg: theme.colors.infoLight,
        onPress: () =>
          rootNavigation.navigate('Attendance', {
            screen: 'AttendanceMain',
            params: RETURN_TO_HOME_PARAMS,
          }),
      },
      {
        key: 'leave',
        label: 'Leave',
        icon: 'calendar-plus',
        color: theme.colors.success,
        iconBg: theme.colors.successLight,
        onPress: () => openQuickAccess('Leave'),
      },
      {
        key: 'payslips',
        label: 'Payslips',
        icon: 'cash',
        color: theme.colors.success,
        iconBg: theme.colors.successLight,
        onPress: () =>
          rootNavigation.navigate('Home', {
            screen: 'Payroll',
            params: {
              screen: 'PayslipList',
              params: RETURN_TO_HOME_PARAMS,
            },
          }),
      },
      {
        key: 'tasks',
        label: 'Tasks',
        icon: 'clipboard-list-outline',
        color: theme.colors.info,
        iconBg: theme.colors.infoLight,
        onPress: () => openQuickAccess('Tasks'),
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: 'chart-bar',
        color: theme.colors.warning,
        iconBg: theme.colors.warningLight,
        onPress: () =>
          rootNavigation.navigate('Reports', {
            screen: 'WorkReportList',
            params: RETURN_TO_HOME_PARAMS,
          }),
      },
      {
        key: 'chat',
        label: 'Chat',
        icon: 'chat-outline',
        color: theme.colors.purple,
        iconBg: theme.colors.purpleLight,
        onPress: () =>
          rootNavigation.navigate('Chat', {
            screen: 'ChatHub',
            params: RETURN_TO_HOME_PARAMS,
          }),
      },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: 'bell-outline',
        color: theme.colors.error,
        iconBg: theme.colors.errorLight,
        badge: unreadCount,
        onPress: () => openQuickAccess('Notifications'),
      },
    ],
    [openQuickAccess, rootNavigation, unreadCount],
  );

  const firstName = user?.fullName?.split(' ')[0] || 'Employee';

  return (
    <View style={styles.container}>
      <DashboardHeader
        welcomeName={firstName}
        role="employee"
        unreadCount={unreadCount}
        onMenuPress={() => openQuickAccess('Profile')}
        onNotificationsPress={() => openQuickAccess('Notifications')}
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
              label="This Month"
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

          {monthlySummary ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Monthly Attendance</Text>
                <Pressable
                  onPress={() =>
                    rootNavigation.navigate('Attendance', {
                      screen: 'AttendanceSummary',
                      params: RETURN_TO_HOME_PARAMS,
                    })
                  }
                  hitSlop={8}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>
              <MonthlyAttendanceSummaryCard stats={monthlySummary.currentMonth} highlight />
              <MonthlyAttendanceSummaryCard stats={monthlySummary.previousMonth} />
            </>
          ) : null}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Today's Attendance</Text>
          {data?.todayAttendance ? (
            <AttendanceCard
              attendance={data.todayAttendance}
              officeStartTime={data.officeHours?.officeStartTime}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attendance marked today</Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Today's Report</Text>
          {data?.todayReport ? (
            <WorkReportCard report={data.todayReport} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No report for today</Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Recent Reports</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  sectionTitleSpaced: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  viewAll: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
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
