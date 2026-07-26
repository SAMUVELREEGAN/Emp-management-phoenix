import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  LeaveCard,
} from '../../components';
import { theme } from '../../constants/theme';
import { leaveApi } from '../../api/leaveApi';
import { getErrorMessage } from '../../utils/errors';
import type { LeaveRequest } from '../../types';
import type { AdminLeaveStackParamList } from '../../navigation/types';
import { useMoreHubBack } from '../../navigation/safeStackBack';

export default function LeaveApprovalListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminLeaveStackParamList>>();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { handleBack, isLeaving } = useMoreHubBack({
    onBeforeBack: () => setLeaves([]),
  });

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await leaveApi.list({ page: 1, limit: 50 });
      setLeaves(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaves();
    }, [fetchLeaves]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Leave Approval"
        subtitle="Review employee leave requests"
        showBack
        onBack={handleBack}
      />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchLeaves()} />
        </View>
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaves(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-remove-outline"
              title="No leave requests"
              message="Employee leave requests will appear here."
            />
          }
          renderItem={({ item }) => (
            <LeaveCard
              leave={item}
              showEmployee
              onPress={() =>
                navigation.navigate('LeaveApprovalDetail', { leaveId: item._id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  list: { padding: theme.spacing.md, flexGrow: 1 },
});
