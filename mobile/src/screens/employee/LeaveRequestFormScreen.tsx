import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  AppInput,
  DatePickerField,
  ErrorMessage,
} from '../../components';
import { theme } from '../../constants/theme';
import { leaveApi } from '../../api/leaveApi';
import { getErrorMessage } from '../../utils/errors';
import { calculateLeaveDuration, toDateInputValue } from '../../utils/dates';
import type { LeaveType } from '../../types';
import type { EmployeeLeaveStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

export default function LeaveRequestFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeLeaveStackParamList>>();
  const [leaveType, setLeaveType] = useState<LeaveType>('full_day');
  const [fromDate, setFromDate] = useState(toDateInputValue());
  const [toDate, setToDate] = useState(toDateInputValue());
  const [halfDayHours, setHalfDayHours] = useState('4');
  const [reason, setReason] = useState('');
  const [durationLabel, setDurationLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useStackBackTo('LeaveList');

  useEffect(() => {
    if (leaveType === 'half_day') {
      setToDate(fromDate);
    }
    const hours = Number(halfDayHours) || 4;
    const duration = calculateLeaveDuration(leaveType, fromDate, toDate, hours);
    setDurationLabel(duration.label);
  }, [leaveType, fromDate, toDate, halfDayHours]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please enter a reason for leave.');
      return;
    }
    if (leaveType === 'half_day') {
      const hours = Number(halfDayHours);
      if (!hours || hours < 1 || hours > 8) {
        setError('Half day hours must be between 1 and 8.');
        return;
      }
    }
    setSubmitting(true);
    setError('');
    try {
      await leaveApi.create({
        leaveType,
        fromDate,
        toDate: leaveType === 'half_day' ? fromDate : toDate,
        halfDayHours: leaveType === 'half_day' ? Number(halfDayHours) : undefined,
        reason: reason.trim(),
      });
      Alert.alert('Success', 'Leave request submitted for admin approval', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Apply Leave" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}
        <Text style={styles.label}>Leave Type</Text>
        <View style={styles.row}>
          <AppButton
            title="Full Day"
            variant={leaveType === 'full_day' ? 'primary' : 'outline'}
            onPress={() => setLeaveType('full_day')}
            style={styles.typeBtn}
          />
          <AppButton
            title="Half Day"
            variant={leaveType === 'half_day' ? 'primary' : 'outline'}
            onPress={() => setLeaveType('half_day')}
            style={styles.typeBtn}
          />
        </View>
        <DatePickerField label="From Date" value={fromDate} onChange={setFromDate} />
        {leaveType === 'full_day' ? (
          <DatePickerField label="To Date" value={toDate} onChange={setToDate} />
        ) : (
          <AppInput
            label="Hours (Half Day)"
            value={halfDayHours}
            onChangeText={setHalfDayHours}
            keyboardType="number-pad"
            placeholder="e.g. 4"
          />
        )}
        <View style={styles.durationBox}>
          <Text style={styles.durationLabel}>Total Duration</Text>
          <Text style={styles.durationValue}>{durationLabel}</Text>
        </View>
        <AppInput
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          placeholder="Why do you need leave?"
        />
        <AppButton title="Submit Leave Request" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  typeBtn: { flex: 1 },
  durationBox: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  durationValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    marginTop: 4,
  },
});
