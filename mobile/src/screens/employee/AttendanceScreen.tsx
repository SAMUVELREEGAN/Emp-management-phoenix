import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  AttendanceCard,
  EarlyCheckoutModal,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatLocationLabel, formatLocationWithCoords, getLocationForAttendance } from '../../utils/location';
import {
  buildOutsideGeofenceMessage,
  getGeofenceStatus,
} from '../../utils/geofenceStatus';
import { formatDistanceMeters } from '../../utils/geofence';
import { useRouteRecorder } from '../../hooks/useRouteRecorder';
import {
  formatLateDuration,
  formatOfficeTime,
  isBeforeOfficeEnd,
  toIsoDateTime,
} from '../../utils/dates';
import type { Attendance, LocationPayload, OfficeHours } from '../../types';
import type {
  EmployeeAttendanceStackParamList,
  HrAttendanceStackParamList,
} from '../../navigation/types';

type AttendanceStackParamList = EmployeeAttendanceStackParamList | HrAttendanceStackParamList;

interface AttendanceScreenProps {
  embedded?: boolean;
}

import { normalizeOfficeHours } from '../../utils/officeHours';

export default function AttendanceScreen({ embedded = false }: AttendanceScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AttendanceStackParamList>>();
  const userRole = useAuthStore(state => state.user?.role);
  const isHr = userRole === 'hr';
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [officeHours, setOfficeHours] = useState<OfficeHours>(
    normalizeOfficeHours(),
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEarlyCheckoutModal, setShowEarlyCheckoutModal] = useState(false);
  const [pendingCheckoutLocation, setPendingCheckoutLocation] = useState<LocationPayload | null>(
    null,
  );
  const [previewLocation, setPreviewLocation] = useState<LocationPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchToday = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError('');
    try {
      const response = await attendanceApi.today();
      const latestOfficeHours = normalizeOfficeHours(response.data.officeHours);
      setAttendance(response.data.attendance);
      setOfficeHours(latestOfficeHours);
      return latestOfficeHours;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchToday();
    }, [fetchToday]),
  );

  const isSessionActive = !!attendance?.checkInTime && !attendance?.checkOutTime;
  const [routeRecordingEnabled, setRouteRecordingEnabled] = useState(false);
  const pendingRouteAfterCheckInRef = useRef(false);

  useRouteRecorder(routeRecordingEnabled && !actionLoading);

  useEffect(() => {
    if (!isSessionActive || isHr) {
      setRouteRecordingEnabled(false);
      return;
    }

    if (pendingRouteAfterCheckInRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      setRouteRecordingEnabled(true);
    }, 12000);

    return () => {
      clearTimeout(timer);
    };
  }, [isSessionActive, isHr]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }

    const timer = setInterval(() => {
      fetchToday();
    }, 60000);

    return () => clearInterval(timer);
  }, [fetchToday, isSessionActive]);

  const canCheckIn = !attendance?.checkInTime;
  const canCheckOut = !!attendance?.checkInTime && !attendance?.checkOutTime;

  const refreshLocationPreview = useCallback(async () => {
    if (!officeHours.geofenceEnabled) {
      setPreviewLocation(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const location = await getLocationForAttendance();
      setPreviewLocation(location);
    } catch {
      setPreviewLocation(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [officeHours.geofenceEnabled]);

  useFocusEffect(
    useCallback(() => {
      if (officeHours.geofenceEnabled) {
        void refreshLocationPreview();
      }
    }, [officeHours.geofenceEnabled, refreshLocationPreview]),
  );

  const previewGeofenceStatus = previewLocation
    ? getGeofenceStatus(
        previewLocation.latitude,
        previewLocation.longitude,
        officeHours,
      )
    : null;

  const validateGeofenceForAttendance = (
    location: LocationPayload,
    action: 'check-in' | 'check-out',
    hours: OfficeHours = officeHours,
  ): boolean => {
    const status = getGeofenceStatus(location.latitude, location.longitude, hours);
    if (!status.enforced || status.within) {
      return true;
    }

    Alert.alert(
      'Outside office area',
      buildOutsideGeofenceMessage(
        status,
        formatLocationWithCoords(location),
        action,
      ),
    );
    return false;
  };

  const handleCheckIn = async () => {
    if (actionLoading) {
      return;
    }
    setRouteRecordingEnabled(false);
    setActionLoading(true);
    try {
      const latestOfficeHours = (await fetchToday({ silent: true })) ?? officeHours;
      const location = await getLocationForAttendance();
      if (!location) {
        return;
      }
      if (!validateGeofenceForAttendance(location, 'check-in', latestOfficeHours)) {
        setPreviewLocation(location);
        return;
      }
      const response = await attendanceApi.checkIn({
        location,
        deviceTimestamp: toIsoDateTime(),
      });
      const checkedIn = response.data.attendance;
      pendingRouteAfterCheckInRef.current = true;

      const lateLabel = formatLateDuration(checkedIn?.lateMinutes);
      const statusMessage =
        checkedIn?.attendanceStatus === 'late' && lateLabel
          ? `You checked in late by ${lateLabel}.`
          : 'Checked in on time.';
      const placeLabel = formatLocationWithCoords(checkedIn?.checkInLocation ?? location);

      setAttendance(checkedIn);
      setPreviewLocation(checkedIn?.checkInLocation ?? location);

      Alert.alert(
        'Checked In',
        `${statusMessage}\n\nLocation:\n${placeLabel}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setTimeout(() => {
                pendingRouteAfterCheckInRef.current = false;
                setRouteRecordingEnabled(true);
              }, 5000);
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const completeCheckOut = async (
    location: LocationPayload,
    earlyCheckoutRemark?: string,
  ) => {
    const response = await attendanceApi.checkOut({
      location,
      deviceTimestamp: toIsoDateTime(),
      earlyCheckoutRemark,
    });
    setAttendance(response.data.attendance);
    setRouteRecordingEnabled(false);
    pendingRouteAfterCheckInRef.current = false;
    Alert.alert(
      'Checked Out',
      `You checked out from:\n${formatLocationWithCoords(response.data.attendance.checkOutLocation ?? location)}`,
    );
  };

  const handleCheckOut = async () => {
    if (actionLoading) {
      return;
    }
    setRouteRecordingEnabled(false);
    setActionLoading(true);
    try {
      const latestOfficeHours = (await fetchToday({ silent: true })) ?? officeHours;
      const location = await getLocationForAttendance();
      if (!location) {
        return;
      }
      if (!validateGeofenceForAttendance(location, 'check-out', latestOfficeHours)) {
        setPreviewLocation(location);
        return;
      }

      if (isBeforeOfficeEnd(latestOfficeHours.officeEndTime)) {
        setPendingCheckoutLocation(location);
        setShowEarlyCheckoutModal(true);
        return;
      }

      await completeCheckOut(location);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEarlyCheckoutConfirm = async (remark: string) => {
    if (!pendingCheckoutLocation || actionLoading) {
      return;
    }
    setActionLoading(true);
    try {
      await completeCheckOut(pendingCheckoutLocation, remark);
      setShowEarlyCheckoutModal(false);
      setPendingCheckoutLocation(null);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEarlyCheckoutCancel = () => {
    setShowEarlyCheckoutModal(false);
    setPendingCheckoutLocation(null);
  };

  const statusLabel =
    attendance?.attendanceStatus === 'late' && attendance.lateMinutes
      ? `Late (${formatLateDuration(attendance.lateMinutes)})`
      : undefined;

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title="My Attendance"
          subtitle={
            isHr
              ? 'Mark your attendance with office hour rules'
              : 'Mark your daily attendance with GPS location'
          }
        />
      ) : null}
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? <ErrorMessage message={error} onRetry={fetchToday} /> : null}

          <View style={styles.officeHoursCard}>
            <Text style={styles.officeHoursTitle}>Office Hours</Text>
            <Text style={styles.officeHoursText}>
              {formatOfficeTime(officeHours.officeStartTime)} -{' '}
              {formatOfficeTime(officeHours.officeEndTime)}
            </Text>
          </View>

          {officeHours.geofenceEnabled ? (
            <View
              style={[
                styles.geofenceCard,
                previewGeofenceStatus?.within === false && styles.geofenceCardOutside,
                previewGeofenceStatus?.within === true && styles.geofenceCardInside,
              ]}>
              <View style={styles.geofenceHeader}>
                <MaterialCommunityIcons
                  name={
                    previewGeofenceStatus?.within === false
                      ? 'map-marker-alert-outline'
                      : 'map-marker-check-outline'
                  }
                  size={20}
                  color={
                    previewGeofenceStatus?.within === false
                      ? theme.colors.error
                      : theme.colors.success
                  }
                />
                <Text style={styles.geofenceTitle}>
                  {previewGeofenceStatus?.within === false
                    ? 'You are outside the office area'
                    : previewGeofenceStatus?.within === true
                      ? 'You are inside the office area'
                      : 'Office geofence is active'}
                </Text>
              </View>
              <Text style={styles.geofenceMeta}>
                {officeHours.officeLocationName || 'Office'} · Allowed radius:{' '}
                {officeHours.geofenceRadiusMeters ?? 200} m
              </Text>
              {previewGeofenceStatus?.within === false &&
              previewGeofenceStatus.distanceMeters != null ? (
                <Text style={styles.geofenceDistance}>
                  Distance from office: {formatDistanceMeters(previewGeofenceStatus.distanceMeters)}
                </Text>
              ) : null}
              {previewLocation ? (
                <Text style={styles.geofenceLocation}>
                  Current location:{'\n'}
                  {formatLocationWithCoords(previewLocation)}
                </Text>
              ) : (
                <Text style={styles.geofenceLocation}>
                  {previewLoading
                    ? 'Detecting your current location...'
                    : 'Tap Refresh Location to check if you are inside the office area.'}
                </Text>
              )}
              <AppButton
                title={previewLoading ? 'Refreshing...' : 'Refresh Location'}
                variant="outline"
                onPress={refreshLocationPreview}
                loading={previewLoading}
                disabled={actionLoading}
                style={styles.refreshButton}
              />
            </View>
          ) : null}

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Today's Status</Text>
            {attendance ? (
              <StatusBadge status={attendance.attendanceStatus} label={statusLabel} />
            ) : (
              <StatusBadge status="absent" label="Not Marked" />
            )}
          </View>

          {isSessionActive && !isHr && routeRecordingEnabled ? (
            <View style={styles.recordingBanner}>
              <MaterialCommunityIcons name="map-marker-path" size={18} color={theme.colors.success} />
              <Text style={styles.recordingText}>
                Route recording is active while the app is open and shared with admin
              </Text>
            </View>
          ) : null}

          {attendance ? <AttendanceCard attendance={attendance} /> : null}

          <View style={styles.actions}>
            <AppButton
              title={actionLoading ? 'Detecting Location...' : 'Check In'}
              onPress={handleCheckIn}
              loading={actionLoading && canCheckIn}
              disabled={!canCheckIn || actionLoading}
              style={styles.button}
            />
            <AppButton
              title={actionLoading ? 'Detecting Location...' : 'Check Out'}
              variant="secondary"
              onPress={handleCheckOut}
              loading={actionLoading && canCheckOut}
              disabled={!canCheckOut || actionLoading}
              style={styles.button}
            />
            <AppButton
              title="View History"
              variant="outline"
              onPress={() => navigation.navigate('AttendanceHistory')}
              style={styles.button}
            />
          </View>
        </ScrollView>
      )}

      <EarlyCheckoutModal
        visible={showEarlyCheckoutModal}
        officeEndTime={formatOfficeTime(officeHours.officeEndTime)}
        loading={actionLoading}
        onConfirm={handleEarlyCheckoutConfirm}
        onCancel={handleEarlyCheckoutCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  officeHoursCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  officeHoursTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  officeHoursText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  geofenceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  geofenceCardInside: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  geofenceCardOutside: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  geofenceTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  geofenceMeta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  geofenceDistance: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.fonts.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  geofenceLocation: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  refreshButton: {
    marginBottom: 0,
  },
  statusCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
  },
  statusLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  actions: {
    marginTop: theme.spacing.md,
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  recordingText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.medium,
  },
});
