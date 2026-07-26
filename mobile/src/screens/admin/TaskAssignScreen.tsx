import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  DatePickerField,
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
        <ScrollView contentContainerStyle={styles.content}>
          {error ? <ErrorMessage message={error} /> : null}
          <Text style={styles.label}>Select Employee</Text>
          {employees.map(emp => (
            <AppButton
              key={emp._id}
              title={`${emp.fullName} (${emp.employeeId})`}
              variant={assignedTo === emp._id ? 'primary' : 'outline'}
              onPress={() => setAssignedTo(emp._id)}
              style={styles.employeeBtn}
            />
          ))}
          <AppInput label="Task Title" value={title} onChangeText={setTitle} />
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <DatePickerField label="Due Date" value={dueDate} onChange={setDueDate} />
          <AppButton title="Assign Task" onPress={handleAssign} loading={submitting} />
        </ScrollView>
      )}
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
  employeeBtn: { marginBottom: theme.spacing.sm },
});
