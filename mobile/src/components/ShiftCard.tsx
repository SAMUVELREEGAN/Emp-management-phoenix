import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import type { Shift } from '../types';
import { formatShiftWindow, formatWorkingDays } from '../utils/shift';
import { StatusBadge } from './StatusBadge';

interface ShiftCardProps {
  shift: Shift;
  onPress?: () => void;
  assignedCount?: number;
}

export function ShiftCard({ shift, onPress, assignedCount }: ShiftCardProps) {
  const content = (
    <>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: shift.color || theme.colors.primary }]} />
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{shift.name}</Text>
          <Text style={styles.code}>{shift.code}</Text>
        </View>
        <StatusBadge status={shift.isActive ? 'active' : 'inactive'} />
      </View>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.meta}>{formatShiftWindow(shift)}</Text>
      </View>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="calendar-week" size={16} color={theme.colors.textMuted} />
        <Text style={styles.meta}>{formatWorkingDays(shift.workingDays)}</Text>
      </View>
      <Text style={styles.footer}>
        Grace {shift.graceMinutes}m · Break {shift.breakDurationMinutes}m
        {assignedCount != null ? ` · ${assignedCount} assigned` : ''}
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
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radii.full,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  code: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 4,
  },
  meta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  footer: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});
