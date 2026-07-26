import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppButton,
  AppHeader,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { leaveApi } from '../../api/leaveApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { LeaveRequest } from '../../types';
import type { EmployeeLeaveStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

function getDurationLabel(leave: LeaveRequest): string {
  if (leave.leaveType === 'half_day') {
    return `${leave.halfDayHours || 4} hours (Half Day)`;
  }
  return `${leave.totalDays} day${leave.totalDays === 1 ? '' : 's'}`;
}

export default function LeaveDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeLeaveStackParamList>>();
  const route = useRoute<RouteProp<EmployeeLeaveStackParamList, 'LeaveDetail'>>();
  const { leaveId } = route.params;
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const { handleBack, isLeaving } = useStackBackTo('LeaveList', {
    onBeforeBack: () => setLeave(null),
  });

  const fetchLeave = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await leaveApi.getById(leaveId);
      setLeave(response.data.leave);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useFocusEffect(
    useCallback(() => {
      fetchLeave();
    }, [fetchLeave]),
  );

  const handleCancel = () => {
    Alert.alert('Cancel leave?', 'This will cancel your pending leave request.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await leaveApi.cancel(leaveId);
            Alert.alert('Cancelled', 'Leave request cancelled', [
              { text: 'OK', onPress: handleBack },
            ]);
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Leave Details" showBack onBack={handleBack} />
      {loading || isLeaving ? (
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
          <Text style={styles.meta}>
            {formatDate(leave.fromDate)}
            {leave.fromDate !== leave.toDate ? ` - ${formatDate(leave.toDate)}` : ''}
          </Text>
          <Text style={styles.duration}>{getDurationLabel(leave)}</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <Text style={styles.body}>{leave.reason}</Text>
          </View>
          {leave.adminComment ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Comment</Text>
              <Text style={styles.body}>{leave.adminComment}</Text>
            </View>
          ) : null}
          {leave.reviewedAt ? (
            <Text style={styles.meta}>Reviewed: {formatDateTime(leave.reviewedAt)}</Text>
          ) : null}
          {leave.status === 'pending' ? (
            <AppButton
              title="Cancel Request"
              variant="danger"
              onPress={handleCancel}
              loading={cancelling}
              style={styles.cancelBtn}
            />
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
    marginBottom: theme.spacing.md,
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
  cancelBtn: { marginTop: theme.spacing.md },
});
