import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UPLOADS_BASE_URL } from '../constants/config';
import { theme } from '../constants/theme';
import { formatTime, formatWorkingHours, isWeeklyHoliday, WEEKLY_HOLIDAY_LABEL } from '../utils/dates';
import { getAttendanceStatusPresentation } from '../utils/attendanceHours';
import type { Attendance, UserSummary } from '../types';
import { StatusBadge } from './StatusBadge';

interface AttendanceOverviewListItemProps {
  attendance: Attendance;
  officeStartTime?: string;
  onPress?: () => void;
  onCorrect?: () => void;
}

function getEmployee(employee: Attendance['employee']): UserSummary | null {
  if (!employee || typeof employee === 'string') {
    return null;
  }
  return employee;
}

function EmployeeThumb({ employee }: { employee: UserSummary | null }) {
  const [imageError, setImageError] = useState(false);
  const photoUri =
    employee?.profilePhoto && !imageError
      ? `${UPLOADS_BASE_URL}${employee.profilePhoto}`
      : undefined;

  return (
    <View style={styles.avatarRing}>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.avatar}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

export function AttendanceOverviewListItem({
  attendance,
  officeStartTime,
  onPress,
  onCorrect,
}: AttendanceOverviewListItemProps) {
  const employee = getEmployee(attendance.employee);
  const isAbsent = attendance._id.startsWith('absent-') || attendance.attendanceStatus === 'absent';
  const isHoliday = isAbsent && isWeeklyHoliday(attendance.date);
  const statusPresentation = getAttendanceStatusPresentation(attendance, { officeStartTime });
  const workingLabel = attendance.totalWorkingMinutes != null
    ? formatWorkingHours(attendance.totalWorkingMinutes)
    : attendance.checkInTime && !attendance.checkOutTime
      ? 'In progress'
      : '—';

  const checkInLabel = attendance.checkInTime ? formatTime(attendance.checkInTime) : '—';
  const checkOutLabel = attendance.checkOutTime ? formatTime(attendance.checkOutTime) : '—';

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}>
        <EmployeeThumb employee={employee} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {employee?.fullName || 'Staff member'}
            </Text>
            <StatusBadge
              status={isHoliday ? 'holiday' : statusPresentation.status}
              label={isHoliday ? WEEKLY_HOLIDAY_LABEL : statusPresentation.label}
            />
          </View>

          {employee?.employeeId ? (
            <Text style={styles.meta} numberOfLines={1}>
              {employee.employeeId}
              {employee.department ? ` • ${employee.department}` : ''}
            </Text>
          ) : null}

          {isAbsent && !attendance.checkInTime ? (
            <Text style={styles.absentHint}>
              {isHoliday ? 'Weekly holiday' : 'No check-in recorded for this date'}
            </Text>
          ) : (
            <View style={styles.timesRow}>
              <View style={styles.timeChip}>
                <MaterialCommunityIcons name="login" size={14} color={theme.colors.primary} />
                <Text style={styles.timeText}>{checkInLabel}</Text>
              </View>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={theme.colors.textMuted}
              />
              <View style={styles.timeChip}>
                <MaterialCommunityIcons name="logout" size={14} color={theme.colors.primary} />
                <Text style={styles.timeText}>{checkOutLabel}</Text>
              </View>
            </View>
          )}

          <View style={styles.footerRow}>
            <View style={styles.hoursChip}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.hoursText}>{workingLabel}</Text>
            </View>
            {attendance.isWorkFromHome ? (
              <View style={styles.wfhChip}>
                <MaterialCommunityIcons name="home-account" size={14} color={theme.colors.info} />
                <Text style={styles.wfhText}>WFH</Text>
              </View>
            ) : null}
          </View>
        </View>

        {onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
        ) : null}
      </Pressable>

      {onCorrect ? (
        <Pressable style={styles.correctLink} onPress={onCorrect} accessibilityRole="button">
          <MaterialCommunityIcons
            name={isAbsent ? 'account-check-outline' : 'calendar-edit'}
            size={16}
            color={theme.colors.primaryDark}
          />
          <Text style={styles.correctText}>
            {isAbsent ? 'Mark Attendance' : 'Correct Attendance'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardPressed: {
    backgroundColor: '#FAFAFA',
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: 2,
    backgroundColor: theme.colors.white,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  absentHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  timeText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  hoursChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  wfhChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.infoLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  wfhText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.info,
  },
  correctLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  correctText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primaryDark,
  },
});
