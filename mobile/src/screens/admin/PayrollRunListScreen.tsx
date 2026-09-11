import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollRun } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';

interface Props {
  embedded?: boolean;
}

export default function PayrollRunListScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const [items, setItems] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await payrollApi.listRuns({ page: 1, limit: 50 });
      setItems(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  if (loading) return <LoadingIndicator fullScreen />;
  if (error) {
    return (
      <View style={styles.center}>
        <ErrorMessage message={error} onRetry={fetchData} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => navigation.navigate('PayrollRunDetail', { runId: item._id })}>
          <View>
            <Text style={styles.title}>{item.month}/{item.year} Payroll</Text>
            <Text style={styles.meta}>{item.employeeCount} employees • Net INR {item.totalNet.toLocaleString()}</Text>
          </View>
          <StatusBadge status={item.status} />
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState title="No payroll runs" message="Create a payroll run for this month." />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  title: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  meta: { marginTop: 4, fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary },
});
