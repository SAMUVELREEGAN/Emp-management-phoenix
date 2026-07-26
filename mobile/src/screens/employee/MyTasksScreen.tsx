import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  TaskCard,
} from '../../components';
import { theme } from '../../constants/theme';
import { taskApi } from '../../api/taskApi';
import { getErrorMessage } from '../../utils/errors';
import type { Task } from '../../types';
import type { EmployeeTasksStackParamList } from '../../navigation/types';
import { useMoreHubBack } from '../../navigation/safeStackBack';

export default function MyTasksScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeTasksStackParamList>>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { handleBack, isLeaving } = useMoreHubBack({
    onBeforeBack: () => setTasks([]),
  });

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await taskApi.myTasks({ page: 1, limit: 50 });
      setTasks(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="My Tasks" subtitle="Tasks assigned by admin" showBack onBack={handleBack} />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchTasks()} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchTasks(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-check-outline"
              title="No tasks assigned"
              message="When admin assigns tasks, they will appear here."
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('EmployeeTaskDetail', { taskId: item._id })}
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
