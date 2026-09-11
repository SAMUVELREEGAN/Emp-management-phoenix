import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  ShiftCard,
  StatCard,
} from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { Shift, ShiftStats } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

interface Props {
  embedded?: boolean;
}

export default function ShiftListScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const role = useAuthStore(state => state.user?.role);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState<ShiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: !embedded });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [shiftResponse, statsResponse] = await Promise.all([
        shiftApi.list({ page: 1, limit: 100, activeOnly: true }),
        shiftApi.stats(),
      ]);
      setShifts(shiftResponse.data.items);
      setStats(statsResponse.data.stats);
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
          title="Shift Management"
          subtitle="Create and manage work shifts"
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
          rightAction={
            <Pressable onPress={() => navigation.navigate('ShiftForm', {})} hitSlop={8}>
              <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
            </Pressable>
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
          data={shifts}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          ListHeaderComponent={
            stats ? (
              <View>
                <View style={styles.statsRow}>
                  <StatCard title="Active Shifts" value={stats.totalShifts} icon="clock-outline" />
                  <StatCard title="Assignments" value={stats.activeAssignments} icon="account-switch" />
                  <Pressable onPress={() => navigation.navigate('ShiftChangeRequestList')}>
                    <StatCard
                      title="Pending Requests"
                      value={stats.pendingChangeRequests}
                      icon="swap-horizontal"
                    />
                  </Pressable>
                </View>
                {!embedded && role === 'admin' ? (
                  <View style={styles.adminLinks}>
                    <Pressable
                      style={styles.adminLink}
                      onPress={() => navigation.navigate('ShiftChangeRequestList')}>
                      <Text style={styles.adminLinkText}>Review Change Requests</Text>
                    </Pressable>
                    <Pressable
                      style={styles.adminLink}
                      onPress={() => navigation.navigate('ShiftReportList')}>
                      <Text style={styles.adminLinkText}>HR Shift Reports</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ShiftCard
              shift={item}
              onPress={() => navigation.navigate('ShiftDetail', { shiftId: item._id })}
            />
          )}
          ListEmptyComponent={<EmptyState title="No shifts yet" message="Create your first work shift." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  adminLinks: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  adminLink: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  adminLinkText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});
