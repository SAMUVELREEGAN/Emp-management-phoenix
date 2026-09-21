import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AppHeader, MoreHubAiFeatureCard, MoreHubMenuItem } from '../../components';
import type { MoreHubMenuItemData } from '../../components/MoreHubMenuItem';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useTabBack } from '../../navigation/safeStackBack';

interface MoreMenuItem extends MoreHubMenuItemData {
  screen: string;
}

export default function MoreHubScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const role = useAuthStore(state => state.user?.role);
  const { unreadCount } = useUnreadNotificationCount();
  useTabBack('Home');

  const adminItems: MoreMenuItem[] = [
    {
      key: 'tasks',
      label: 'Tasks',
      subtitle: 'Assign and manage tasks',
      icon: 'clipboard-list-outline',
      color: theme.colors.info,
      iconBg: theme.colors.infoLight,
      screen: 'Tasks',
    },
    {
      key: 'leave',
      label: 'Leave',
      subtitle: 'Approve leave requests',
      icon: 'calendar-remove-outline',
      color: theme.colors.success,
      iconBg: theme.colors.successLight,
      screen: 'Leave',
    },
    {
      key: 'track',
      label: 'Live Tracking',
      subtitle: 'Track employee routes',
      icon: 'map-marker-path',
      color: theme.colors.info,
      iconBg: theme.colors.infoLight,
      screen: 'Track',
    },
    {
      key: 'shifts',
      label: 'Shift Management',
      subtitle: 'Shifts, assignments, and reports',
      icon: 'clock-time-four-outline',
      color: theme.colors.purple,
      iconBg: theme.colors.purpleLight,
      screen: 'Shifts',
    },
    {
      key: 'payroll',
      label: 'Payroll',
      subtitle: 'Salary roster and payroll runs',
      icon: 'cash-multiple',
      color: theme.colors.success,
      iconBg: theme.colors.successLight,
      screen: 'Payroll',
    },
    {
      key: 'reports',
      label: 'Reports',
      subtitle: 'Work report approvals',
      icon: 'chart-bar',
      color: theme.colors.warning,
      iconBg: theme.colors.warningLight,
      screen: 'Reports',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      subtitle: 'Alerts and announcements',
      icon: 'bell-outline',
      color: theme.colors.error,
      iconBg: theme.colors.errorLight,
      screen: 'Notifications',
      badge: unreadCount,
    },
    {
      key: 'profile',
      label: 'Profile',
      subtitle: 'Account and settings',
      icon: 'account-outline',
      color: theme.colors.textSecondary,
      iconBg: theme.colors.surface,
      screen: 'Profile',
    },
  ];

  const hrItems: MoreMenuItem[] = [
    {
      key: 'payroll',
      label: 'Payroll',
      subtitle: 'Onboarding, salary, and payslips',
      icon: 'cash-multiple',
      color: theme.colors.success,
      iconBg: theme.colors.successLight,
      screen: 'Payroll',
    },
    {
      key: 'shifts',
      label: 'Shift Management',
      subtitle: 'Assign shifts and send reports',
      icon: 'clock-time-four-outline',
      color: theme.colors.purple,
      iconBg: theme.colors.purpleLight,
      screen: 'Shifts',
    },
    {
      key: 'reports',
      label: 'Reports',
      subtitle: 'Review work reports',
      icon: 'chart-bar',
      color: theme.colors.warning,
      iconBg: theme.colors.warningLight,
      screen: 'Reports',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      subtitle: 'Alerts and announcements',
      icon: 'bell-outline',
      color: theme.colors.error,
      iconBg: theme.colors.errorLight,
      screen: 'Notifications',
      badge: unreadCount,
    },
    {
      key: 'profile',
      label: 'Profile',
      subtitle: 'Account and settings',
      icon: 'account-outline',
      color: theme.colors.textSecondary,
      iconBg: theme.colors.surface,
      screen: 'Profile',
    },
  ];

  const employeeItems: MoreMenuItem[] = [
    {
      key: 'onboarding',
      label: 'Onboarding',
      subtitle: 'Submit documents and bank details',
      icon: 'file-document-outline',
      color: theme.colors.info,
      iconBg: theme.colors.infoLight,
      screen: 'EmployeeOnboarding',
    },
    {
      key: 'attendance-summary',
      label: 'My Attendance',
      subtitle: 'This month and previous month summary',
      icon: 'calendar-month-outline',
      color: theme.colors.info,
      iconBg: theme.colors.infoLight,
      screen: 'AttendanceSummary',
    },
    {
      key: 'payslips',
      label: 'My Payslips',
      subtitle: 'View salary slips and deductions',
      icon: 'cash',
      color: theme.colors.success,
      iconBg: theme.colors.successLight,
      screen: 'PayslipList',
    },
    {
      key: 'my-shift',
      label: 'My Shift',
      subtitle: 'View schedule and request changes',
      icon: 'clock-outline',
      color: theme.colors.purple,
      iconBg: theme.colors.purpleLight,
      screen: 'MyShift',
    },
    {
      key: 'tasks',
      label: 'Tasks',
      subtitle: 'View assigned tasks',
      icon: 'clipboard-check-outline',
      color: theme.colors.info,
      iconBg: theme.colors.infoLight,
      screen: 'Tasks',
    },
    {
      key: 'leave',
      label: 'Leave',
      subtitle: 'Apply and track leave',
      icon: 'calendar-clock-outline',
      color: theme.colors.success,
      iconBg: theme.colors.successLight,
      screen: 'Leave',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      subtitle: 'Alerts and updates',
      icon: 'bell-outline',
      color: theme.colors.error,
      iconBg: theme.colors.errorLight,
      screen: 'Notifications',
      badge: unreadCount,
    },
    {
      key: 'profile',
      label: 'Profile',
      subtitle: 'Account and settings',
      icon: 'account-outline',
      color: theme.colors.textSecondary,
      iconBg: theme.colors.surface,
      screen: 'Profile',
    },
  ];

  const items = role === 'employee' ? employeeItems : role === 'hr' ? hrItems : adminItems;
  const isHrMode = role === 'hr' || role === 'admin';

  const handleItemPress = useCallback(
    (item: MoreMenuItem) => {
      if (item.key === 'my-shift' && role === 'employee') {
        navigation.getParent()?.navigate('Attendance', { screen: 'MyShift' });
        return;
      }
      if (item.key === 'attendance-summary' && role === 'employee') {
        navigation.getParent()?.navigate('Attendance', { screen: 'AttendanceSummary' });
        return;
      }
      if ((item.key === 'onboarding' || item.key === 'payslips') && role === 'employee') {
        navigation.navigate('Payroll', { screen: item.screen });
        return;
      }
      navigation.navigate(item.screen);
    },
    [navigation, role],
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="More" subtitle="All features" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <MoreHubAiFeatureCard
          title={isHrMode ? 'AI HR Analytics' : 'AI Employee Assistant'}
          subtitle={
            isHrMode
              ? 'Late arrivals, absenteeism, tasks & overtime insights'
              : 'Ask about leaves, check-in, hours worked & tasks'
          }
          variant={isHrMode ? 'analytics' : 'assistant'}
          onPress={() => navigation.navigate('AiAssistant')}
        />

        <View style={styles.menuList}>
          {items.map(item => (
            <MoreHubMenuItem
              key={item.key}
              item={item}
              onPress={() => handleItemPress(item)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  menuList: {
    gap: 10,
  },
});
