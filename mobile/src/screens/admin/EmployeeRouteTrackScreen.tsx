import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  RouteMapView,
  RouteTimeline,
} from '../../components';
import { theme } from '../../constants/theme';
import { routeApi } from '../../api/routeApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { RoutePoint, RouteSession } from '../../types';
import type { AdminTrackStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

type TabMode = 'live' | 'history';

export default function EmployeeRouteTrackScreen() {
  const route = useRoute<RouteProp<AdminTrackStackParamList, 'EmployeeRouteTrack'>>();
  const { employeeId, employeeName } = route.params;

  const [tab, setTab] = useState<TabMode>('live');
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [session, setSession] = useState<RouteSession | null>(null);
  const [history, setHistory] = useState<RouteSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);

  const clearMapState = useCallback(() => {
    setShowMap(false);
    setPoints([]);
    setSession(null);
    setHistory([]);
    setTab('live');
    setLoading(false);
    setRefreshing(false);
  }, []);

  const { handleBack, leavingRef } = useFabricSafeBack({
    routes: [{ name: 'TrackEmployees' }],
    index: 0,
    onBeforeBack: clearMapState,
    delayMs: 420,
  });

  const fetchLive = useCallback(async () => {
    const response = await routeApi.employeeToday(employeeId);
    setSession(response.data.session);
    setPoints(response.data.points);
  }, [employeeId]);

  const fetchHistory = useCallback(async () => {
    const response = await routeApi.employeeHistory(employeeId, 1, 30);
    setHistory(response.data.items);
  }, [employeeId]);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (leavingRef.current) {
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        await Promise.all([fetchLive(), fetchHistory()]);
      } catch (err) {
        if (!leavingRef.current) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!leavingRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchLive, fetchHistory, leavingRef],
  );

  useFocusEffect(
    useCallback(() => {
      setShowMap(true);
      fetchData();
      const timer = setInterval(() => {
        if (tab === 'live' && !leavingRef.current) {
          void fetchLive();
        }
      }, 4000);
      return () => clearInterval(timer);
    }, [fetchData, fetchLive, tab, leavingRef]),
  );

  const openHistorySession = async (sessionItem: RouteSession) => {
    setLoading(true);
    try {
      const response = await routeApi.session(sessionItem._id);
      setSession(response.data.session);
      setPoints(response.data.points);
      setTab('live');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title={employeeName}
        subtitle="Route tracking"
        showBack
        onBack={handleBack}
      />
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'live' && styles.tabActive]}
          onPress={() => setTab('live')}>
          <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>Today / Live</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : tab === 'live' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
          }>
          {session ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                {session.isActive ? 'Live route in progress' : 'Today\'s route'}
              </Text>
              <Text style={styles.infoMeta}>
                Started {formatDateTime(session.startedAt)}
                {session.endedAt ? ` • Ended ${formatDateTime(session.endedAt)}` : ''}
              </Text>
              <Text style={styles.infoMeta}>{session.pointCount} GPS points recorded</Text>
              {session.lastAddress ? (
                <Text style={styles.lastSeen}>Last location: {session.lastAddress}</Text>
              ) : null}
            </View>
          ) : (
            <EmptyState
              icon="map-marker-off-outline"
              title="No route today"
              message="Route recording starts when the employee checks in."
            />
          )}
          {showMap ? (
            <RouteMapView
              points={points}
              height={380}
              isLive={!!session?.isActive}
              employeeName={employeeName}
            />
          ) : null}
          {showMap ? <RouteTimeline points={points} /> : null}
        </ScrollView>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="No route history"
              message="Completed routes will appear here after check-out."
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.historyCard} onPress={() => openHistorySession(item)}>
              <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
              <Text style={styles.historyMeta}>
                {formatDateTime(item.startedAt)}
                {item.endedAt ? ` - ${formatDateTime(item.endedAt)}` : ''}
              </Text>
              <Text style={styles.historyPoints}>{item.pointCount} route points</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  tabActive: { backgroundColor: theme.colors.primaryLight },
  tabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  infoMeta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  lastSeen: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyDate: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  historyMeta: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  historyPoints: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fonts.weights.semibold,
  },
});
