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

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="More" subtitle="All features" />
      <ScrollView contentContainerStyle={styles.content}>
        {items.map(item => (
          <Pressable
            key={item.key}
            style={[styles.row, theme.shadows.card]}
            onPress={() => navigation.navigate(item.screen)}
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
