import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import type { Notification, NotificationType } from '../types';

interface NotificationCardProps {
  notification: Notification;
  targetLabel?: string;
  timeLabel: string;
  onPress: () => void;
}

type IconConfig = {
  name: string;
  color: string;
  background: string;
};

function getTypeIcon(type: NotificationType): IconConfig {
  switch (type) {
    case 'attendance':
      return { name: 'clock-check-outline', color: theme.colors.info, background: theme.colors.infoLight };
    case 'work_report':
      return { name: 'file-document-outline', color: theme.colors.purple, background: theme.colors.purpleLight };
    case 'leave':
      return { name: 'calendar-remove', color: theme.colors.warning, background: theme.colors.warningLight };
    case 'task':
      return { name: 'clipboard-check-outline', color: theme.colors.success, background: theme.colors.successLight };
    case 'chat':
      return { name: 'message-text-outline', color: theme.colors.info, background: theme.colors.infoLight };
    case 'announcement':
      return { name: 'bullhorn-outline', color: theme.colors.primaryDark, background: theme.colors.primaryLight };
    case 'shift':
      return { name: 'calendar-clock', color: theme.colors.purple, background: theme.colors.purpleLight };
    case 'payroll':
      return { name: 'cash-multiple', color: theme.colors.success, background: theme.colors.successLight };
    case 'onboarding':
      return { name: 'account-plus-outline', color: theme.colors.info, background: theme.colors.infoLight };
    case 'employee':
      return { name: 'account-outline', color: theme.colors.textSecondary, background: '#F3F4F6' };
    case 'system':
    default:
      return { name: 'bell-ring-outline', color: theme.colors.textSecondary, background: '#F3F4F6' };
  }
}

export function NotificationCard({
  notification,
  targetLabel,
  timeLabel,
  onPress,
}: NotificationCardProps) {
  const icon = getTypeIcon(notification.type);
  const isUnread = !notification.isRead;

  return (
    <Pressable
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
      accessibilityRole="button">
      {isUnread ? <View style={styles.unreadAccent} /> : null}
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: icon.background }]}>
          <MaterialCommunityIcons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
              {notification.title}
            </Text>
            {isUnread ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.message}>{notification.message}</Text>
          {targetLabel ? (
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>{targetLabel}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primaryDark} />
            </View>
          ) : null}
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.textMuted} />
            <Text style={styles.time}>{timeLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardUnread: {
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: '#FFFDF5',
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radii.xl,
    borderBottomLeftRadius: theme.radii.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    lineHeight: 22,
  },
  titleUnread: {
    fontWeight: theme.fonts.weights.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  message: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    gap: 2,
  },
  ctaText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.accent,
    fontWeight: theme.fonts.weights.semibold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  time: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.medium,
  },
});
