import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
import type { AdminTasksStackParamList } from '../../navigation/types';
import { useMoreHubBack } from '../../navigation/safeStackBack';

export default function AdminTaskListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminTasksStackParamList>>();
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
      const response = await taskApi.list({ page: 1, limit: 50 });
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
      <AppHeader
        title="Tasks"
        subtitle="Assign and review employee tasks"
        showBack
        onBack={handleBack}
        rightAction={
          <Pressable onPress={() => navigation.navigate('TaskAssign')} hitSlop={8}>
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
          </Pressable>
        }
      />
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
              icon="clipboard-text-outline"
              title="No tasks yet"
              message="Assign a task to an employee to get started."
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              showEmployee
              onPress={() => navigation.navigate('AdminTaskDetail', { taskId: item._id })}
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
