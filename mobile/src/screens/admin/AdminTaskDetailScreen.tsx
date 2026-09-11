import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  AppHeader,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { taskApi } from '../../api/taskApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { Task, UserSummary } from '../../types';
import type { AdminTasksStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

function getName(user: UserSummary | string): string {
  if (typeof user === 'string') {
    return 'User';
  }
  return user.fullName;
}

export default function AdminTaskDetailScreen() {
  const route = useRoute<RouteProp<AdminTasksStackParamList, 'AdminTaskDetail'>>();
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'AdminTaskList' }],
    index: 0,
    onBeforeBack: () => setTask(null),
  });

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await taskApi.getById(taskId);
      setTask(response.data.task);
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

  const badgeStatus =
    task?.status === 'submitted' && task.completionStatus
      ? task.completionStatus
      : task?.status || 'assigned';

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="Task Details" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchTask} />
        </View>
      ) : task ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{task.title}</Text>
            <StatusBadge status={badgeStatus} />
          </View>
          <Text style={styles.meta}>Assigned to: {getName(task.assignedTo)}</Text>
          <Text style={styles.meta}>Assigned by: {getName(task.assignedBy)}</Text>
          {task.dueDate ? <Text style={styles.meta}>Due: {formatDate(task.dueDate)}</Text> : null}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{task.description}</Text>
          </View>
          {task.status === 'submitted' ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Employee Remark</Text>
                <Text style={styles.body}>{task.employeeRemark || '-'}</Text>
              </View>
              <Text style={styles.meta}>
                Submitted: {task.submittedAt ? formatDateTime(task.submittedAt) : '-'}
              </Text>
            </>
          ) : null}
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
    marginBottom: 4,
  },
  section: {
    marginTop: theme.spacing.lg,
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
});
