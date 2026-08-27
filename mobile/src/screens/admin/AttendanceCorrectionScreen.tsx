import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  AppInput,
  DatePickerField,
  ErrorMessage,
  TimePickerField,
} from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { settingsApi } from '../../api/settingsApi';
import { getErrorMessage } from '../../utils/errors';
import {
  combineDateAndTime,
  formatDate,
  isoToTimeString,
  toDateInputValue,
} from '../../utils/dates';
import { normalizeOfficeHours } from '../../utils/officeHours';
import type {
  AdminAttendanceStackParamList,
  HrAttendanceStackParamList,
} from '../../navigation/types';

type CorrectionStack = AdminAttendanceStackParamList | HrAttendanceStackParamList;
type Props = NativeStackScreenProps<CorrectionStack, 'AttendanceCorrection'>;

export default function AttendanceCorrectionScreen({ navigation, route }: Props) {
  const {
    employeeId,
    employeeName,
    date: initialDate,
    attendanceId,
    checkInTime,
    checkOutTime,
  } = route.params;

  const [date, setDate] = useState(initialDate);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isNewRecord = !attendanceId;

  useEffect(() => {
    settingsApi
      .getOfficeHours()
      .then(response => {
        const officeHours = normalizeOfficeHours(response.data.officeHours);
        setCheckIn(
          isoToTimeString(checkInTime) || officeHours.officeStartTime,
        );
        setCheckOut(
          isoToTimeString(checkOutTime) || officeHours.officeEndTime,
        );
      })
      .catch(() => {
        setCheckIn(isoToTimeString(checkInTime) || '09:30');
        setCheckOut(isoToTimeString(checkOutTime) || '18:00');
      });
  }, [checkInTime, checkOutTime]);

  const title = useMemo(
    () => (isNewRecord ? 'Mark Attendance' : 'Correct Attendance'),
    [isNewRecord],
  );

  const handleSubmit = async () => {
    if (!checkIn) {
      setError('Check-in time is required');
      return;
    }

    if (!remark.trim()) {
      setError('Please enter a reason for this correction');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await attendanceApi.correct({
        employeeId,
        date,
        checkInTime: combineDateAndTime(date, checkIn),
        checkOutTime: checkOut ? combineDateAndTime(date, checkOut) : undefined,
        correctionRemark: remark.trim(),
        attendanceId,
      });

      Alert.alert(
        'Attendance saved',
        isNewRecord
          ? 'Attendance has been marked for this employee.'
          : 'Attendance record has been updated.',
        [
          {
            text: 'View details',
            onPress: () =>
              navigation.replace('AttendanceDetail', {
                attendanceId: response.data.attendance._id,
              }),
          },
        ],
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save attendance correction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={title} showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.heroText}>
              {isNewRecord
                ? 'Employee forgot to check in/out but was present. Enter the actual office times below.'
                : 'Update the actual check-in or check-out time if the employee forgot to mark attendance.'}
            </Text>
          </View>

          {error ? <ErrorMessage message={error} /> : null}

          <DatePickerField label="Attendance Date" value={date} onChange={setDate} />

          <TimePickerField label="Actual Check-In Time" value={checkIn} onChange={setCheckIn} />

          <TimePickerField
            label="Actual Check-Out Time (optional)"
            value={checkOut}
            onChange={setCheckOut}
          />

          <AppInput
            label="Reason for correction"
            value={remark}
            onChangeText={setRemark}
            placeholder="e.g. Employee reached office on time but forgot to check in"
            multiline
            numberOfLines={3}
            style={styles.remarkInput}
          />

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>HR note</Text>
            <Text style={styles.noteText}>
              Late / present status is calculated from the check-in time you enter.
              The employee will be notified after you save.
            </Text>
          </View>

          <AppButton
            title={isNewRecord ? 'Mark Present' : 'Save Correction'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  heroCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  employeeName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heroText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  remarkInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  noteCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noteTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
