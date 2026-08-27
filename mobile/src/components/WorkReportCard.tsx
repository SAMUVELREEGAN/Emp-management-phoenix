import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { formatDate, formatTime } from '../utils/dates';
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
  const isHourlyReport = report.reportType === 'hourly_work';
  const summaryLine = isAttendanceSummary && report.attendanceSummary
    ? `Present ${report.attendanceSummary.present} • Absent ${report.attendanceSummary.absent} • Late ${report.attendanceSummary.late}`
    : report.workSummary;

  const periodLabel =
    isHourlyReport && report.reportPeriodStart && report.reportPeriodEnd
      ? `${formatTime(report.reportPeriodStart)} - ${formatTime(report.reportPeriodEnd)}`
      : null;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {report.title}
        </Text>
        <StatusBadge status={report.status} />
      </View>
      {isHourlyReport ? (
        <View style={styles.kindBadge}>
          <Text style={styles.kindBadgeText}>{report.attachment ? 'GeoCam Hourly' : 'Hourly'}</Text>
        </View>
      ) : null}
      {showEmployee ? (
        <Text style={styles.employee}>{getEmployeeName(report.employee)}</Text>
      ) : null}
      <Text style={styles.date}>
        {formatDate(report.reportDate)}
        {periodLabel ? ` • ${periodLabel}` : ''}
      </Text>
      <Text style={styles.summary} numberOfLines={2}>
        {summaryLine}
      </Text>
      {!isAttendanceSummary ? (
        <Text style={styles.hours}>
          {isHourlyReport ? 'Hourly report' : `${report.workingHours} hrs`}
        </Text>
      ) : null}
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
  kindBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.infoLight,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.info,
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
