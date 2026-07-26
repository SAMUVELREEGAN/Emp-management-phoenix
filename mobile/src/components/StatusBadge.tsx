import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

type StatusType =
  | 'active'
  | 'inactive'
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'completed'
  | 'partial'
  | 'pending'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: theme.colors.successLight, color: theme.colors.success, label: 'Active' },
  inactive: { bg: theme.colors.errorLight, color: theme.colors.error, label: 'Inactive' },
  present: { bg: theme.colors.successLight, color: theme.colors.success, label: 'Present' },
  late: { bg: theme.colors.warningLight, color: theme.colors.warning, label: 'Late' },
  absent: { bg: theme.colors.errorLight, color: theme.colors.error, label: 'Absent' },
  half_day: { bg: theme.colors.infoLight, color: theme.colors.info, label: 'Half Day' },
  on_leave: { bg: theme.colors.primaryLight, color: theme.colors.primary, label: 'On Leave' },
  draft: { bg: theme.colors.surface, color: theme.colors.textSecondary, label: 'Draft' },
  submitted: { bg: theme.colors.infoLight, color: theme.colors.info, label: 'Submitted' },
  approved: { bg: theme.colors.successLight, color: theme.colors.success, label: 'Approved' },
  rejected: { bg: theme.colors.errorLight, color: theme.colors.error, label: 'Rejected' },
  assigned: { bg: theme.colors.warningLight, color: theme.colors.warning, label: 'Assigned' },
  completed: { bg: theme.colors.successLight, color: theme.colors.success, label: 'Completed' },
  partial: { bg: theme.colors.infoLight, color: theme.colors.info, label: 'Partial' },
  pending: { bg: theme.colors.warningLight, color: theme.colors.warning, label: 'Pending' },
  cancelled: { bg: theme.colors.surface, color: theme.colors.textSecondary, label: 'Cancelled' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: theme.colors.surface,
    color: theme.colors.textSecondary,
    label: status,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{label || config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  text: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    textTransform: 'capitalize',
  },
});
