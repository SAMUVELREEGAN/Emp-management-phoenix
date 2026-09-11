import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { onboardingApi } from '../../api/onboardingApi';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeOnboarding, UserSummary } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';

interface Props {
  embedded?: boolean;
}

function getEmployee(onboarding: EmployeeOnboarding): UserSummary | null {
  return typeof onboarding.employee === 'object' ? onboarding.employee : null;
}

export default function OnboardingReviewListScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const [items, setItems] = useState<EmployeeOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await onboardingApi.listForReview({ page: 1, limit: 100 });
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
      contentContainerStyle={[styles.list, embedded && styles.listEmbedded]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
      renderItem={({ item }) => {
        const employee = getEmployee(item);
        const employeeId =
          employee?._id || (typeof item.employee === 'string' ? item.employee : '');
        return (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('OnboardingReviewDetail', { employeeId })
            }>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.title}>{employee?.fullName || 'Employee'}</Text>
                <Text style={styles.meta}>{employee?.department} • {employee?.employeeId}</Text>
                <Text style={styles.meta}>Proposed: INR {item.proposedMonthlySalary?.toLocaleString()}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={<EmptyState title="No onboarding requests" message="Employee submissions will appear here." />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  listEmbedded: { paddingTop: 0 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex: { flex: 1, paddingRight: theme.spacing.sm },
  title: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  meta: { marginTop: 2, fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary },
});
