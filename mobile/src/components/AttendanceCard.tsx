import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { formatDate, formatLateDuration, formatTime, formatWorkingHours, isWeeklyHoliday, WEEKLY_HOLIDAY_LABEL } from '../utils/dates';
import { formatLocationWithCoords } from '../utils/location';
import { useLiveWorkingHours } from '../hooks/useLiveWorkingHours';
import { getBreakMinutes, getAttendanceStatusPresentation } from '../utils/attendanceHours';
import type { Attendance, UserRole, UserSummary } from '../types';
import { StatusBadge } from './StatusBadge';

interface AttendanceCardProps {
  attendance: Attendance;
  onPress?: () => void;
  showEmployee?: boolean;
  officeStartTime?: string;
}

function getEmployeeName(employee: UserSummary | string | undefined | null): string {
  if (!employee || typeof employee === 'string') {
    return 'Staff member';
  }
  return employee.fullName;
}

function getEmployeeRole(employee: UserSummary | string | undefined | null): UserRole | undefined {
  if (!employee || typeof employee === 'string') {
    return undefined;
  }
  return employee.role;
}

export function AttendanceCard({
  attendance,
  onPress,
  showEmployee = false,
  officeStartTime,
}: AttendanceCardProps) {
  const employeeRole = getEmployeeRole(attendance.employee);
  const { label: workingHoursLabel, isActive } = useLiveWorkingHours(attendance);
  const statusPresentation = getAttendanceStatusPresentation(attendance, { officeStartTime });
  const breakMinutes = getBreakMinutes(attendance);
  const lateMinutes = statusPresentation.lateMinutes;
  const isAbsentOnly = attendance.attendanceStatus === 'absent' && !attendance.checkInTime;
  const isHoliday = isAbsentOnly && isWeeklyHoliday(attendance.date);

  if (isAbsentOnly && showEmployee) {
    const absentContent = (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.date}>{formatDate(attendance.date)}</Text>
          <View style={styles.employeeRow}>
            <Text style={styles.employee}>{getEmployeeName(attendance.employee)}</Text>
            {employeeRole === 'hr' ? <Text style={styles.roleTag}>HR</Text> : null}
          </View>
        </View>
        <StatusBadge
          status={isHoliday ? 'holiday' : attendance.attendanceStatus}
          label={isHoliday ? WEEKLY_HOLIDAY_LABEL : undefined}
        />
      </View>
    );

    if (onPress) {
      return (
        <Pressable style={styles.card} onPress={onPress}>
          {absentContent}
        </Pressable>
      );
    }

    return <View style={styles.card}>{absentContent}</View>;
  }

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.date}>{formatDate(attendance.date)}</Text>
          {showEmployee ? (
            <View style={styles.employeeRow}>
              <Text style={styles.employee}>{getEmployeeName(attendance.employee)}</Text>
              {employeeRole === 'hr' ? <Text style={styles.roleTag}>HR</Text> : null}
            </View>
          ) : null}
        </View>
        <StatusBadge
          status={statusPresentation.status}
          label={statusPresentation.label}
        />
      </View>
      {lateMinutes > 0 ? (
        <View style={styles.lateBanner}>
          <MaterialCommunityIcons name="clock-alert-outline" size={16} color={theme.colors.warning} />
          <Text style={styles.lateText}>Late by {formatLateDuration(lateMinutes)}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <MaterialCommunityIcons name="login" size={18} color={theme.colors.primary} />
        <Text style={styles.label}>Check In:</Text>
        <Text style={styles.value}>{formatTime(attendance.checkInTime)}</Text>
      </View>
      {attendance.checkInLocation ? (
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.locationText}>{formatLocationWithCoords(attendance.checkInLocation)}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <MaterialCommunityIcons name="logout" size={18} color={theme.colors.primary} />
        <Text style={styles.label}>Check Out:</Text>
        <Text style={styles.value}>{formatTime(attendance.checkOutTime)}</Text>
      </View>
      {attendance.checkOutLocation ? (
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.locationText}>{formatLocationWithCoords(attendance.checkOutLocation)}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.label}>Working Hours:</Text>
        <Text style={[styles.value, isActive && styles.valueActive]}>{workingHoursLabel}</Text>
      </View>
      {breakMinutes > 0 ? (
        <View style={styles.breakInfoRow}>
          <MaterialCommunityIcons name="coffee-outline" size={16} color={theme.colors.warning} />
          <Text style={styles.breakInfoText}>Break: {formatWorkingHours(breakMinutes)}</Text>
        </View>
      ) : null}
      {attendance.checkOutTime && (attendance.overtimeMinutes ?? 0) > 0 ? (
        <View style={styles.otBanner}>
          <MaterialCommunityIcons name="clock-plus-outline" size={16} color={theme.colors.info} />
          <Text style={styles.otText}>
            Overtime (OT): {formatWorkingHours(attendance.overtimeMinutes ?? 0)}
          </Text>
        </View>
      ) : null}
      {attendance.isEarlyCheckout && attendance.earlyCheckoutRemark ? (
        <View style={styles.remarkBox}>
          <Text style={styles.remarkTitle}>Early Check-Out Remark</Text>
          <Text style={styles.remarkText}>{attendance.earlyCheckoutRemark}</Text>
        </View>
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
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  date: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  employee: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  roleTag: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginTop: 2,
    marginBottom: theme.spacing.xs,
    paddingLeft: 26,
  },
  locationText: {
    flex: 1,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
  },
  valueActive: {
    color: theme.colors.primary,
  },
  lateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  lateText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.warning,
    fontWeight: theme.fonts.weights.semibold,
  },
  breakInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    paddingLeft: 26,
  },
  breakInfoText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.warning,
    fontWeight: theme.fonts.weights.medium,
  },
  otBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.infoLight,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  otText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.info,
    fontWeight: theme.fonts.weights.semibold,
  },
  remarkBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  remarkTitle: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  remarkText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
});
