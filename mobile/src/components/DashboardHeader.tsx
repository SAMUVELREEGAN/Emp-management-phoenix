import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import {
  ILLUSTRATION_HEIGHT,
  ILLUSTRATION_WIDTH,
  WorkingIllustration,
} from './WorkingIllustration';
import type { UserRole } from '../types';

interface DashboardHeaderProps {
  welcomeName?: string;
  role?: UserRole;
  unreadCount?: number;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
}

function getWelcomeSubtitle(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Manage your team and daily operations.';
    case 'hr':
      return 'Review attendance, payroll, and reports.';
    case 'employee':
    default:
      return 'Track your attendance and work day.';
  }
}

export function DashboardHeader({
  welcomeName = 'User',
  role = 'employee',
  unreadCount = 0,
  onMenuPress,
  onNotificationsPress,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const displayName = welcomeName.trim() || 'User';

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onMenuPress}
          style={styles.iconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open menu">
          <MaterialCommunityIcons name="menu" size={26} color={theme.colors.text} />
        </Pressable>
        <Pressable
          onPress={onNotificationsPress}
          style={styles.iconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.textColumn}>
          <Text style={styles.welcomeTitle} numberOfLines={2}>
            Welcome, {displayName}!
          </Text>
          <Text style={styles.welcomeSubtitle}>{getWelcomeSubtitle(role)}</Text>
        </View>
        <View style={styles.illustrationColumn}>
          <WorkingIllustration />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    minHeight: ILLUSTRATION_HEIGHT + theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.xs,
    ...theme.shadows.card,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: theme.spacing.sm,
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.accent,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  welcomeSubtitle: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    paddingRight: theme.spacing.xs,
  },
  illustrationColumn: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
});
