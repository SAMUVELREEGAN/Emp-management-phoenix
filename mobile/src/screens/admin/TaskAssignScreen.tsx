import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  DatePickerField,
  EmployeeSelectField,
  ErrorMessage,
  LoadingIndicator,
} from '../../components';
import { theme } from '../../constants/theme';
import { employeeApi } from '../../api/employeeApi';
import { taskApi } from '../../api/taskApi';
import { getErrorMessage } from '../../utils/errors';
import { toDateInputValue } from '../../utils/dates';
import type { User } from '../../types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function TaskAssignScreen() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(toDateInputValue());

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'AdminTaskList' }],
    index: 0,
  });

  useEffect(() => {
    employeeApi
      .list({ page: 1, limit: 100, status: 'active', role: 'employee' })
      .then(res => setEmployees(res.data.items))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const handleAssign = async () => {
    if (!assignedTo || !title.trim() || !description.trim()) {
      setError('Select employee, title, and description.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await taskApi.assign({
        assignedTo,
        title: title.trim(),
        description: description.trim(),
        dueDate,
      });
      Alert.alert('Success', 'Task assigned successfully', [
        { text: 'OK', onPress: () => handleBack() },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Assign Task" showBack onBack={handleBack} />
      {loadingEmployees ? (
        <LoadingIndicator fullScreen />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {error ? <ErrorMessage message={error} /> : null}

            <View style={styles.formCard}>
              <EmployeeSelectField
                label="Select Employee"
                employees={employees}
                value={assignedTo}
                onChange={setAssignedTo}
                loading={loadingEmployees}
              />
              <AppInput label="Task Title" value={title} onChangeText={setTitle} />
              <AppInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
              <DatePickerField label="Due Date" value={dueDate} onChange={setDueDate} />
            </View>

            <AppButton
              title="Assign Task"
              onPress={handleAssign}
              loading={submitting}
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  submitBtn: {
    marginTop: theme.spacing.xs,
  },
});
