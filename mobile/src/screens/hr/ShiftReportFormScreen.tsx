import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppHeader, AppInput, DatePickerField } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import { useFabricSafeBack } from '../../navigation/safeStackBack';
import { toDateInputValue } from '../../utils/shift';

export default function ShiftReportFormScreen() {
  const today = toDateInputValue();
  const weekAgo = toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'ShiftReportList' }], index: 0 });

  const [title, setTitle] = useState('Weekly Shift Summary');
  const [periodFrom, setPeriodFrom] = useState(weekAgo);
  const [periodTo, setPeriodTo] = useState(today);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Report title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await shiftApi.submitReport({
        title: title.trim(),
        periodFrom,
        periodTo,
        notes: notes.trim(),
      });
      Alert.alert('Submitted', 'Shift report sent to admin successfully.', [
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
      <AppHeader title="Submit Shift Report" subtitle="Send summary to admin" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppInput label="Report Title" value={title} onChangeText={setTitle} />
        <DatePickerField label="Period From" value={periodFrom} onChange={setPeriodFrom} />
        <DatePickerField label="Period To" value={periodTo} onChange={setPeriodTo} />
        <AppInput
          label="Notes for Admin"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Key observations, staffing gaps, attendance issues..."
        />
        <AppButton title="Send Report to Admin" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
});
