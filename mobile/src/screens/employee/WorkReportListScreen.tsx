import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, EmptyState, ErrorMessage, LoadingIndicator, WorkReportCard } from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import type { WorkReport } from '../../types';
import type { EmployeeReportsStackParamList } from '../../navigation/types';

export default function WorkReportListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeReportsStackParamList>>();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await workReportApi.myReports({ page: 1, limit: 50 });
      setReports(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports]),
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Work Reports"
        subtitle="Your daily reports"
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('WorkReportForm', {})}
            hitSlop={8}>
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
          </Pressable>
        }
      />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchReports()} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No reports yet"
              message="Create your first work report."
              actionLabel="Create Report"
              onAction={() => navigation.navigate('WorkReportForm', {})}
            />
          }
          renderItem={({ item }) => (
            <WorkReportCard
              report={item}
              onPress={() => navigation.navigate('WorkReportDetail', { reportId: item._id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
});
