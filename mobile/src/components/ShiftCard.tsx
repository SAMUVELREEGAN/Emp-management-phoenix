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
  const accent = shift.color || theme.colors.primary;

  const content = (
    <>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.header}>
        <View style={[styles.colorBadge, { backgroundColor: accent }]}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.white} />
        </View>
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
      <View style={styles.footerRow}>
        <Text style={styles.footer}>
          Grace {shift.graceMinutes}m · Break {shift.breakDurationMinutes}m
          {assignedCount != null ? ` · ${assignedCount} assigned` : ''}
        </Text>
        {onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingLeft: 4,
  },
  colorBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
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
    fontWeight: theme.fonts.weights.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 4,
    paddingLeft: 4,
  },
  meta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingLeft: 4,
    gap: theme.spacing.sm,
  },
  footer: {
    flex: 1,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});
