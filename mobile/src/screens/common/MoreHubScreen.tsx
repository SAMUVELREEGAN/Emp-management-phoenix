import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AppHeader } from '../../components';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useTabBack } from '../../navigation/safeStackBack';

interface MoreMenuItem {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  iconBg: string;
  screen: string;
  badge?: number;
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

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="More" subtitle="All features" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={[styles.aiCard, theme.shadows.card]}
          onPress={() => navigation.navigate('AiAssistant')}
          accessibilityRole="button">
          <View style={styles.aiIconWrap}>
            <MaterialCommunityIcons
              name={isHrMode ? 'chart-timeline-variant' : 'robot-outline'}
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.aiTextWrap}>
            <Text style={styles.aiTitle}>
              {isHrMode ? 'AI HR Analytics' : 'AI Employee Assistant'}
            </Text>
            <Text style={styles.aiSubtitle}>
              {isHrMode
                ? 'Late arrivals, absenteeism, tasks & overtime insights'
                : 'Ask about leaves, check-in, hours worked & tasks'}
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        </Pressable>

        {items.map(item => (
          <Pressable
            key={item.key}
            style={[styles.row, theme.shadows.card]}
            onPress={() => {
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
            }}
            accessibilityRole="button">
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            {item.badge && item.badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
              </View>
            ) : null}
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
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
    gap: theme.spacing.sm,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  aiIconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextWrap: {
    flex: 1,
  },
  aiTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  aiSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  aiBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: theme.spacing.xs,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: theme.spacing.xs,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
  },
});
