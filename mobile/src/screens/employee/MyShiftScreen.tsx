import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, ShiftCard } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeShiftHours, Shift, ShiftAssignment } from '../../types';
import type { EmployeeAttendanceStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';
import { formatShiftWindow, formatWorkingDays } from '../../utils/shift';
import { formatDate } from '../../utils/dates';

export default function MyShiftScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EmployeeAttendanceStackParamList>>();
  const [assignment, setAssignment] = useState<ShiftAssignment | null>(null);
  const [shiftHours, setShiftHours] = useState<EmployeeShiftHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: true });

  const fetchShift = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shiftApi.myShift();
      setAssignment(response.data.assignment);
      setShiftHours(response.data.shiftHours);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchShift();
    }, [fetchShift]),
  );

  const shift = assignment?.shift && typeof assignment.shift !== 'string' ? assignment.shift : null;

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="My Shift"
        subtitle="Your current work schedule"
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('ShiftChangeRequestList')}
            hitSlop={8}>
            <MaterialCommunityIcons name="history" size={26} color={theme.colors.white} />
          </Pressable>
        }
      />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchShift} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {shift ? (
            <>
              <ShiftCard shift={shift as Shift} />
              <View style={styles.infoCard}>
                <Text style={styles.label}>Effective From</Text>
                <Text style={styles.value}>{formatDate(assignment?.effectiveFrom)}</Text>
                <Text style={styles.label}>Working Days</Text>
                <Text style={styles.value}>{formatWorkingDays(shift.workingDays)}</Text>
                <Text style={styles.label}>Shift Window</Text>
                <Text style={styles.value}>{formatShiftWindow(shift)}</Text>
                <Text style={styles.label}>Grace Period</Text>
                <Text style={styles.value}>{shift.graceMinutes} minutes</Text>
                {assignment?.notes ? (
                  <>
                    <Text style={styles.label}>Assignment Notes</Text>
                    <Text style={styles.value}>{assignment.notes}</Text>
                  </>
                ) : null}
              </View>
              <AppButton
                title="Request Shift Change"
                onPress={() => navigation.navigate('ShiftChangeRequestForm')}
              />
            </>
          ) : shiftHours ? (
            <View style={styles.infoCard}>
              <Text style={styles.emptyTitle}>Office default hours</Text>
              <Text style={styles.emptyText}>
                HR has not assigned a personal shift yet. Attendance uses office hours below.
              </Text>
              <Text style={styles.label}>Working Hours</Text>
              <Text style={styles.value}>
                {shiftHours.officeStartTime} - {shiftHours.officeEndTime}
              </Text>
              <Text style={styles.label}>Working Days</Text>
              <Text style={styles.value}>{formatWorkingDays(shiftHours.workingDays)}</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="clock-alert-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No shift assigned</Text>
              <Text style={styles.emptyText}>
                HR has not assigned a shift to your profile yet. Office default hours will apply for attendance.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  label: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
  value: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
  emptyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
