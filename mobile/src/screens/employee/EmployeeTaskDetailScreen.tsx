import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { taskApi } from '../../api/taskApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/dates';
import type { Task, TaskCompletionStatus } from '../../types';
import type { EmployeeTasksStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

export default function EmployeeTaskDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeTasksStackParamList>>();
  const route = useRoute<RouteProp<EmployeeTasksStackParamList, 'EmployeeTaskDetail'>>();
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completionStatus, setCompletionStatus] = useState<TaskCompletionStatus>('completed');
  const [remark, setRemark] = useState('');

  const { handleBack, isLeaving } = useStackBackTo('MyTasks', {
    onBeforeBack: () => setTask(null),
  });

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await taskApi.getById(taskId);
      setTask(response.data.task);
      setRemark(response.data.task.employeeRemark || '');
      if (response.data.task.completionStatus) {
        setCompletionStatus(response.data.task.completionStatus);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      fetchTask();
    }, [fetchTask]),
  );

  const handleSubmit = async () => {
    if (!remark.trim()) {
      setError('Please add a remark before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await taskApi.submit(taskId, {
        completionStatus,
        employeeRemark: remark.trim(),
      });
      Alert.alert('Success', 'Task submitted to admin', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = task?.status === 'assigned';
  const badgeStatus =
    task?.status === 'submitted' && task.completionStatus
      ? task.completionStatus
      : task?.status || 'assigned';

  return (
    <View style={styles.container}>
      <AppHeader title="Task Details" showBack onBack={handleBack} />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error && !task ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchTask} />
        </View>
      ) : task ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{task.title}</Text>
            <StatusBadge status={badgeStatus} />
          </View>
          {task.dueDate ? <Text style={styles.meta}>Due: {formatDate(task.dueDate)}</Text> : null}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{task.description}</Text>
          </View>
          {canSubmit ? (
            <>
              {error ? <ErrorMessage message={error} /> : null}
              <Text style={styles.label}>Completion Status</Text>
              <View style={styles.statusRow}>
                <AppButton
                  title="Completed"
                  variant={completionStatus === 'completed' ? 'primary' : 'outline'}
                  onPress={() => setCompletionStatus('completed')}
                  style={styles.statusBtn}
                />
                <AppButton
                  title="Partial"
                  variant={completionStatus === 'partial' ? 'primary' : 'outline'}
                  onPress={() => setCompletionStatus('partial')}
                  style={styles.statusBtn}
                />
              </View>
              <AppInput
                label="Remark"
                value={remark}
                onChangeText={setRemark}
                multiline
                numberOfLines={4}
                placeholder="Describe what was completed or pending..."
              />
              <AppButton title="Submit to Admin" onPress={handleSubmit} loading={submitting} />
            </>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Remark</Text>
              <Text style={styles.body}>{task.employeeRemark || '-'}</Text>
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, padding: theme.spacing.md },
  content: { padding: theme.spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  body: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statusBtn: { flex: 1 },
});
