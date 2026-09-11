import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator, ShiftChangeRequestCard, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { ShiftChangeRequest } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function ShiftChangeRequestDetailScreen() {
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftChangeRequestDetail'>>();
  const { requestId } = route.params;
  const userRole = useAuthStore(state => state.user?.role);
  const [request, setRequest] = useState<ShiftChangeRequest | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ShiftChangeRequestList' }],
    index: 0,
    onBeforeBack: () => setRequest(null),
  });

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shiftApi.getChangeRequest(requestId);
      setRequest(response.data.request);
      setComment(response.data.request.adminComment || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      fetchRequest();
    }, [fetchRequest]),
  );

  const handleReview = async (status: 'approved' | 'rejected') => {
    setReviewing(true);
    try {
      await shiftApi.reviewChangeRequest(requestId, { status, adminComment: comment.trim() });
      Alert.alert('Success', `Request ${status}`, [{ text: 'OK', onPress: handleBack }]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  const canReview = request?.status === 'pending' && (userRole === 'admin' || userRole === 'hr');

  return (
    <View style={styles.container}>
      <AppHeader title="Review Request" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchRequest} />
        </View>
      ) : request ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShiftChangeRequestCard request={request} showEmployee />
          <View style={styles.infoCard}>
            <Text style={styles.label}>Submitted</Text>
            <Text style={styles.value}>{formatDateTime(request.createdAt)}</Text>
            {request.reviewedAt ? (
              <>
                <Text style={styles.label}>Reviewed</Text>
                <Text style={styles.value}>{formatDateTime(request.reviewedAt)}</Text>
              </>
            ) : null}
            <Text style={styles.label}>Status</Text>
            <StatusBadge status={request.status} />
          </View>
          {canReview ? (
            <>
              <AppInput label="Review Comment" value={comment} onChangeText={setComment} multiline />
              <AppButton title="Approve" onPress={() => handleReview('approved')} loading={reviewing} />
              <AppButton title="Reject" variant="danger" onPress={() => handleReview('rejected')} loading={reviewing} />
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  label: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
  value: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
});
