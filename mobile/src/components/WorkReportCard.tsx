import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {report.title}
          </Text>
          <StatusBadge status={report.status} />
        </View>

        {isHourlyReport ? (
          <View style={styles.kindBadge}>
            <MaterialCommunityIcons name="camera-outline" size={12} color={theme.colors.info} />
            <Text style={styles.kindBadgeText}>{report.attachment ? 'GeoCam Hourly' : 'Hourly'}</Text>
          </View>
        ) : null}

        {showEmployee ? (
          <View style={styles.employeeRow}>
            <MaterialCommunityIcons name="account-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.employee}>{getEmployeeName(report.employee)}</Text>
          </View>
        ) : null}

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={theme.colors.textMuted} />
          <Text style={styles.date}>
            {formatDate(report.reportDate)}
            {periodLabel ? ` • ${periodLabel}` : ''}
          </Text>
        </View>

        <Text style={styles.summary} numberOfLines={2}>
          {summaryLine}
        </Text>

        <View style={styles.footer}>
          {!isAttendanceSummary ? (
            <Text style={styles.hours}>
              {isHourlyReport ? 'Hourly report' : `${report.workingHours} hrs`}
            </Text>
          ) : (
            <View />
          )}
          {onPress ? (
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          ) : null}
        </View>
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
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardPressed: {
    opacity: 0.97,
  },
  accent: {
    width: 4,
    backgroundColor: theme.colors.primary,
  },
  body: {
    flex: 1,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md - 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    lineHeight: 22,
  },
  kindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.infoLight,
    borderRadius: theme.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  kindBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.info,
    letterSpacing: 0.2,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  employee: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.semibold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  date: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  summary: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  footer: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hours: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.fonts.weights.bold,
    letterSpacing: 0.2,
  },
});
