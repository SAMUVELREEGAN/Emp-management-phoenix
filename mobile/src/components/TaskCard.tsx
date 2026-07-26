import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { formatDate } from '../utils/dates';
import type { Task, UserSummary } from '../types';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  showEmployee?: boolean;
}

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'Employee' : user.fullName;
}

export function TaskCard({ task, onPress, showEmployee = false }: TaskCardProps) {
  const badgeStatus =
    task.status === 'submitted' && task.completionStatus
      ? task.completionStatus
      : task.status;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <StatusBadge status={badgeStatus} />
      </View>
      {showEmployee ? (
        <Text style={styles.meta}>Assigned to: {getName(task.assignedTo)}</Text>
      ) : null}
      <Text style={styles.description} numberOfLines={2}>
        {task.description}
      </Text>
      <Text style={styles.meta}>
        {task.dueDate ? `Due: ${formatDate(task.dueDate)} • ` : ''}
        Assigned: {formatDate(task.createdAt)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  meta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});
