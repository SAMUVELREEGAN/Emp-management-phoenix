import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, AttendanceCard, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatLocationLabel } from '../../utils/location';
import { formatLateDuration } from '../../utils/dates';
import type { Attendance, UserSummary } from '../../types';
import type {
  AdminAttendanceStackParamList,
  HrAttendanceStackParamList,
} from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

type AttendanceDetailStack = AdminAttendanceStackParamList | HrAttendanceStackParamList;

function getEmployeeName(employee: UserSummary | string): string {
  if (typeof employee === 'string') {
    return 'Staff member';
  }
  return `${employee.fullName} (${employee.employeeId})`;
}

export default function AttendanceDetailScreen() {
  const route = useRoute<RouteProp<AttendanceDetailStack, 'AttendanceDetail'>>();
  const { attendanceId } = route.params;
  const userRole = useAuthStore(state => state.user?.role);
  const isHr = userRole === 'hr';

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clearScreenState = useCallback(() => {
    setAttendance(null);
    setLoading(false);
  }, []);

  const backRoutes = useMemo(
    () => (isHr ? [{ name: 'AttendanceMain' }] : [{ name: 'AttendanceOverview' }]),
    [isHr],
  );

  const { handleBack, leavingRef } = useFabricSafeBack({
    routes: backRoutes,
    index: 0,
    onBeforeBack: clearScreenState,
  });

  const fetchAttendance = useCallback(async () => {
    if (leavingRef.current) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.getById(attendanceId);
      if (!leavingRef.current) {
        setAttendance(response.data.attendance);
      }
    } catch (err) {
      if (!leavingRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (!leavingRef.current) {
        setLoading(false);
      }
    }
  }, [attendanceId]);

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [fetchAttendance]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="Attendance Details" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchAttendance} />
        </View>
      ) : attendance ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.employee}>{getEmployeeName(attendance.employee)}</Text>
            <StatusBadge status={attendance.attendanceStatus} />
          </View>
          <AttendanceCard attendance={attendance} />
          {attendance.lateMinutes && attendance.lateMinutes > 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Late Arrival</Text>
              <Text style={styles.infoText}>
                Checked in late by {formatLateDuration(attendance.lateMinutes)} after office start
                time.
              </Text>
            </View>
          ) : null}
          {attendance.isEarlyCheckout && attendance.earlyCheckoutRemark ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Early Check-Out Remark</Text>
              <Text style={styles.infoText}>{attendance.earlyCheckoutRemark}</Text>
            </View>
          ) : null}
          {attendance.checkInLocation ? (
            <LocationBlock title="Check-In Location" location={attendance.checkInLocation} />
          ) : null}
          {attendance.checkOutLocation ? (
            <LocationBlock title="Check-Out Location" location={attendance.checkOutLocation} />
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function LocationBlock({
  title,
  location,
}: {
  title: string;
  location: { latitude: number; longitude: number; address?: string };
}) {
  const placeName = formatLocationLabel(location);

  return (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
        <Text style={styles.locationTitle}>{title}</Text>
      </View>
      <Text style={styles.placeName}>{placeName}</Text>
      <Text style={styles.coordinates}>
        GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  employee: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  locationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  locationTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  placeName: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  coordinates: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
