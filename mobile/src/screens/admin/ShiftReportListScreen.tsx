import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, EmptyState, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/dates';
import type { ShiftReport, UserSummary } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

interface Props {
  embedded?: boolean;
}

function getName(user: UserSummary | string): string {
  return typeof user === 'string' ? 'HR' : user.fullName;
}

export default function ShiftReportListScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const role = useAuthStore(state => state.user?.role);
  const isHr = role === 'hr';
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: !embedded });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await shiftApi.listReports({ page: 1, limit: 50 });
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
      fetchData();
    }, [fetchData]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title={isHr ? 'My Shift Reports' : 'HR Shift Reports'}
          subtitle={isHr ? 'Reports sent to admin' : 'Review HR shift summaries'}
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
          rightAction={
            isHr ? (
              <Pressable onPress={() => navigation.navigate('ShiftReportForm')} hitSlop={8}>
                <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
              </Pressable>
            ) : undefined
          }
        />
      ) : null}
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ShiftReportDetail', { reportId: item._id })}>
              <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.meta}>By {getName(item.submittedBy)}</Text>
              <Text style={styles.meta}>
                {formatDate(item.periodFrom)} - {formatDate(item.periodTo)}
              </Text>
              <Text style={styles.meta}>
                {item.snapshot.totalShifts} shifts · {item.snapshot.activeAssignments} assignments
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState title="No reports" message={isHr ? 'Submit your first shift report to admin.' : 'No HR shift reports yet.'} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  title: { flex: 1, fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  meta: { fontSize: theme.fonts.sizes.sm, color: theme.colors.textMuted, marginTop: 2 },
});
