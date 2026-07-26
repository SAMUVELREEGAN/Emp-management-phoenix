import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { formatDate } from '../utils/dates';
import type { UserSummary, WorkReport } from '../types';
import { StatusBadge } from './StatusBadge';

interface WorkReportCardProps {
  report: WorkReport;
  onPress?: () => void;
  showEmployee?: boolean;
}

function getEmployeeName(employee: UserSummary | string): string {
  if (typeof employee === 'string') {
    return 'Staff member';
  }
  return employee.fullName;
}

export function WorkReportCard({ report, onPress, showEmployee = false }: WorkReportCardProps) {
  const isAttendanceSummary = report.reportType === 'attendance_summary';
  const summaryLine = isAttendanceSummary && report.attendanceSummary
    ? `Present ${report.attendanceSummary.present} • Absent ${report.attendanceSummary.absent} • Late ${report.attendanceSummary.late}`
    : report.workSummary;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {report.title}
        </Text>
        <StatusBadge status={report.status} />
      </View>
      {showEmployee ? (
        <Text style={styles.employee}>{getEmployeeName(report.employee)}</Text>
      ) : null}
      <Text style={styles.date}>{formatDate(report.reportDate)}</Text>
      <Text style={styles.summary} numberOfLines={2}>
        {summaryLine}
      </Text>
      {!isAttendanceSummary ? <Text style={styles.hours}>{report.workingHours} hrs</Text> : null}
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
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  employee: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  date: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  summary: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  hours: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
});
