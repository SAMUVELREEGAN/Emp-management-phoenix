import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

interface DashboardHeaderProps {
  title?: string;
  welcomeName?: string;
  unreadCount?: number;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
}

export function DashboardHeader({
  title = 'Dashboard',
  welcomeName = 'User',
  unreadCount = 0,
  onMenuPress,
  onNotificationsPress,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const roleLabel = welcomeName.trim() || 'User';

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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.welcome}>
        Welcome, {roleLabel} 👋
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
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
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  welcome: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
