import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { leaveApi } from '../../api/leaveApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { LeaveRequest, UserSummary } from '../../types';
import type { AdminLeaveStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'Employee' : `${user.fullName} (${user.employeeId})`;
}

function getDurationLabel(leave: LeaveRequest): string {
  if (leave.leaveType === 'half_day') {
    return `${leave.halfDayHours || 4} hours (Half Day)`;
  }
  return `${leave.totalDays} day${leave.totalDays === 1 ? '' : 's'}`;
}

export default function LeaveApprovalDetailScreen() {
  const route = useRoute<RouteProp<AdminLeaveStackParamList, 'LeaveApprovalDetail'>>();
  const { leaveId } = route.params;
  const userRole = useAuthStore(state => state.user?.role);
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'LeaveApprovalList' }],
    index: 0,
    onBeforeBack: () => setLeave(null),
  });

  const { control, handleSubmit, reset } = useForm<{ adminComment: string }>({
    defaultValues: { adminComment: '' },
  });

  const fetchLeave = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await leaveApi.getById(leaveId);
      setLeave(response.data.leave);
      reset({ adminComment: response.data.leave.adminComment || '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [leaveId, reset]);

  useFocusEffect(
    useCallback(() => {
      fetchLeave();
    }, [fetchLeave]),
  );

  const handleReview = async (status: 'approved' | 'rejected', adminComment: string) => {
    setReviewing(true);
    try {
      await leaveApi.review(leaveId, { status, adminComment: adminComment.trim() });
      Alert.alert('Success', `Leave request ${status}`, [
        { text: 'OK', onPress: () => handleBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  const canReview = leave?.status === 'pending' && userRole === 'admin';

  return (
    <View style={styles.container}>
      <AppHeader title="Review Leave" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchLeave} />
        </View>
      ) : leave ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {leave.leaveType === 'half_day' ? 'Half Day Leave' : 'Full Day Leave'}
            </Text>
            <StatusBadge status={leave.status} />
          </View>
          <Text style={styles.meta}>{getName(leave.employee)}</Text>
          <Text style={styles.meta}>
            {formatDate(leave.fromDate)}
            {leave.fromDate !== leave.toDate ? ` - ${formatDate(leave.toDate)}` : ''}
          </Text>
          <Text style={styles.duration}>{getDurationLabel(leave)}</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <Text style={styles.body}>{leave.reason}</Text>
          </View>
          {leave.reviewedAt ? (
            <Text style={styles.meta}>Reviewed: {formatDateTime(leave.reviewedAt)}</Text>
          ) : null}
          {canReview ? (
            <>
              <Controller
                control={control}
                name="adminComment"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Admin Comment (optional)"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
              <View style={styles.actions}>
                <AppButton
                  title="Reject"
                  variant="danger"
                  loading={reviewing}
                  onPress={handleSubmit(values => handleReview('rejected', values.adminComment))}
                  style={styles.actionBtn}
                />
                <AppButton
                  title="Approve"
                  loading={reviewing}
                  onPress={handleSubmit(values => handleReview('approved', values.adminComment))}
                  style={styles.actionBtn}
                />
              </View>
            </>
          ) : leave.adminComment ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Comment</Text>
              <Text style={styles.body}>{leave.adminComment}</Text>
            </View>
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
  duration: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.md,
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
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: { flex: 1 },
});
