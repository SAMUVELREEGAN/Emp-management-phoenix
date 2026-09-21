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

function ShiftHubStatTile({
  title,
  value,
  icon,
  onPress,
}: {
  title: string;
  value: number;
  icon: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.statTile}>
      <View style={styles.statIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.statPressable, pressed && styles.statPressed]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.statPressable}>{content}</View>;
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
              <View style={styles.headerBlock}>
                <View style={styles.statsPanel}>
                  <ShiftHubStatTile
                    title="Active Shifts"
                    value={stats.totalShifts}
                    icon="clock-outline"
                  />
                  <ShiftHubStatTile
                    title="Assignments"
                    value={stats.activeAssignments}
                    icon="account-switch"
                  />
                  <ShiftHubStatTile
                    title="Pending Requests"
                    value={stats.pendingChangeRequests}
                    icon="swap-horizontal"
                    onPress={() => navigation.navigate('ShiftChangeRequestList')}
                  />
                </View>
                {!embedded && role === 'admin' ? (
                  <View style={styles.adminLinks}>
                    <Pressable
                      style={({ pressed }) => [styles.adminLink, styles.adminLinkPrimary, pressed && styles.linkPressed]}
                      onPress={() => navigation.navigate('ShiftChangeRequestList')}>
                      <MaterialCommunityIcons name="swap-horizontal" size={20} color={theme.colors.accent} />
                      <Text style={styles.adminLinkText}>Review Change Requests</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.adminLink, pressed && styles.linkPressed]}
                      onPress={() => navigation.navigate('ShiftReportList')}>
                      <MaterialCommunityIcons name="file-chart-outline" size={20} color={theme.colors.accent} />
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
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  headerBlock: {
    marginBottom: theme.spacing.md,
  },
  statsPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statPressable: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
  },
  statPressed: {
    opacity: 0.94,
  },
  statTile: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'flex-start',
    ...theme.shadows.card,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primaryDark,
  },
  statTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: theme.fonts.weights.medium,
  },
  adminLinks: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  adminLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  adminLinkPrimary: {
    borderColor: 'rgba(255, 215, 0, 0.55)',
    backgroundColor: '#FFFCF5',
  },
  linkPressed: {
    opacity: 0.95,
  },
  adminLinkText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.accent,
    textAlign: 'center',
  },
});
