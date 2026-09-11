import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import type { MonthlyAttendanceStats } from '../types';

interface MonthlyAttendanceSummaryCardProps {
  stats: MonthlyAttendanceStats;
  highlight?: boolean;
}

export function MonthlyAttendanceSummaryCard({
  stats,
  highlight = false,
}: MonthlyAttendanceSummaryCardProps) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={22}
          color={highlight ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={styles.title}>{stats.label}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatItem label="Present" value={stats.present} color={theme.colors.success} />
        <StatItem label="Late" value={stats.late} color={theme.colors.warning} />
        <StatItem label="Absent" value={stats.absent} color={theme.colors.error} />
        <StatItem label="Half Day" value={stats.halfDay} color={theme.colors.info} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>On leave: {stats.onLeave}</Text>
        <Text style={styles.footerText}>Late minutes: {stats.totalLateMinutes}</Text>
        <Text style={styles.footerText}>Working days: {stats.workingDays}</Text>
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  cardHighlight: {
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statItem: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
  },
  statLabel: {
    marginTop: 2,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  footer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 4,
  },
  footerText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
