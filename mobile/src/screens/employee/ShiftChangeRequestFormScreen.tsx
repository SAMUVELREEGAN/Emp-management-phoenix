import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppHeader, AppInput, DatePickerField } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeShiftHours, Shift } from '../../types';
import { formatShiftWindow, toDateInputValue } from '../../utils/shift';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function ShiftChangeRequestFormScreen() {
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'MyShift' }], index: 0 });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShiftHours, setCurrentShiftHours] = useState<EmployeeShiftHours | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(toDateInputValue());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      const [activeResponse, myShiftResponse] = await Promise.all([
        shiftApi.listActive({ page: 1, limit: 100 }),
        shiftApi.myShift(),
      ]);
      setShifts(activeResponse.data.items);
      setCurrentShiftHours(myShiftResponse.data.shiftHours);
    } catch {
      setShifts([]);
      setCurrentShiftHours(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchShifts();
    }, [fetchShifts]),
  );

  const handleSubmit = async () => {
    if (!selectedShiftId || !reason.trim()) {
      Alert.alert('Validation', 'Select a shift and provide a reason.');
      return;
    }

    setSubmitting(true);
    try {
      await shiftApi.createChangeRequest({
        requestedShiftId: selectedShiftId,
        effectiveDate,
        reason: reason.trim(),
      });
      Alert.alert('Submitted', 'Your shift change request has been sent for review.', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Request Shift Change" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {currentShiftHours?.isShiftAssigned ? (
          <View style={styles.currentCard}>
            <Text style={styles.currentTitle}>Current Shift</Text>
            <Text style={styles.currentValue}>
              {currentShiftHours.shiftName} ({currentShiftHours.officeStartTime} -{' '}
              {currentShiftHours.officeEndTime})
            </Text>
          </View>
        ) : null}
        <Text style={styles.label}>Requested Shift</Text>
        {shifts.map(shift => {
          const selected = selectedShiftId === shift._id;
          return (
            <AppButton
              key={shift._id}
              title={`${shift.name} (${formatShiftWindow(shift)})`}
              variant={selected ? 'primary' : 'outline'}
              onPress={() => setSelectedShiftId(shift._id)}
              style={styles.shiftButton}
            />
          );
        })}
        <DatePickerField label="Effective Date" value={effectiveDate} onChange={setEffectiveDate} />
        <AppInput
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Explain why you need this shift change"
        />
        <AppButton title="Submit Request" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  shiftButton: { marginBottom: theme.spacing.sm },
  currentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  currentTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  currentValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.semibold,
  },
});
