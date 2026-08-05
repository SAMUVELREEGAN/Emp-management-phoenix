import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LeaveCard,
  LoadingIndicator,
} from '../../components';
import { theme } from '../../constants/theme';
import { leaveApi } from '../../api/leaveApi';
import { getErrorMessage } from '../../utils/errors';
import type { LeaveRequest } from '../../types';
import type { EmployeeLeaveStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function LeaveListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeLeaveStackParamList>>();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setLeaves([]),
  });

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await leaveApi.myRequests({ page: 1, limit: 50 });
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
        title="Leave Requests"
        subtitle="Apply and track your leave"
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('LeaveRequestForm')}
            hitSlop={8}>
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
          </Pressable>
        }
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
              icon="calendar-clock-outline"
              title="No leave requests"
              message="Tap + to apply for leave."
            />
          }
          renderItem={({ item }) => (
            <LeaveCard
              leave={item}
              onPress={() => navigation.navigate('LeaveDetail', { leaveId: item._id })}
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
