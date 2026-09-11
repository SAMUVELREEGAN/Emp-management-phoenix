import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { formatDate } from '../utils/dates';
import type { ShiftChangeRequest, UserSummary } from '../types';
import { getShiftName, formatShiftWindow } from '../utils/shift';
import { StatusBadge } from './StatusBadge';

interface ShiftChangeRequestCardProps {
  request: ShiftChangeRequest;
  onPress?: () => void;
  showEmployee?: boolean;
}

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'Employee' : user.fullName;
}

export function ShiftChangeRequestCard({
  request,
  onPress,
  showEmployee = false,
}: ShiftChangeRequestCardProps) {
  const currentShift =
    typeof request.currentShift === 'string' ? undefined : request.currentShift;
  const requestedShift =
    typeof request.requestedShift === 'string' ? undefined : request.requestedShift;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Shift Change Request</Text>
        <StatusBadge status={request.status} />
      </View>
      {showEmployee ? <Text style={styles.meta}>{getName(request.employee)}</Text> : null}
      <Text style={styles.meta}>Effective: {formatDate(request.effectiveDate)}</Text>
      <Text style={styles.shiftLine}>
        {getShiftName(currentShift)}
        {currentShift ? ` (${formatShiftWindow(currentShift)})` : ''} → {getShiftName(requestedShift)}
        {requestedShift ? ` (${formatShiftWindow(requestedShift)})` : ''}
      </Text>
      <Text style={styles.reason} numberOfLines={2}>{request.reason}</Text>
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
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  shiftLine: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  reason: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
  },
});
