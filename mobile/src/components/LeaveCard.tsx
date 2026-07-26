import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { formatDate } from '../utils/dates';
import type { LeaveRequest, UserSummary } from '../types';
import { StatusBadge } from './StatusBadge';

interface LeaveCardProps {
  leave: LeaveRequest;
  onPress?: () => void;
  showEmployee?: boolean;
}

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'Employee' : user.fullName;
}

function getDurationLabel(leave: LeaveRequest): string {
  if (leave.leaveType === 'half_day') {
    return `${leave.halfDayHours || 4} hours (Half Day)`;
  }
  return `${leave.totalDays} day${leave.totalDays === 1 ? '' : 's'}`;
}

export function LeaveCard({ leave, onPress, showEmployee = false }: LeaveCardProps) {
  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>
          {leave.leaveType === 'half_day' ? 'Half Day Leave' : 'Full Day Leave'}
        </Text>
        <StatusBadge status={leave.status} />
      </View>
      {showEmployee ? (
        <Text style={styles.meta}>{getName(leave.employee)}</Text>
      ) : null}
      <Text style={styles.meta}>
        {formatDate(leave.fromDate)}
        {leave.fromDate !== leave.toDate ? ` - ${formatDate(leave.toDate)}` : ''}
      </Text>
      <Text style={styles.duration}>{getDurationLabel(leave)}</Text>
      <Text style={styles.reason} numberOfLines={2}>
        {leave.reason}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  duration: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  reason: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});
