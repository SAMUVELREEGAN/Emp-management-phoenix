import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { theme } from '../../constants/theme';
import { routeApi } from '../../api/routeApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/dates';
import type { TrackableEmployee } from '../../types';
import type { AdminTrackStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function TrackEmployeesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminTrackStackParamList>>();
  const [employees, setEmployees] = useState<TrackableEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setEmployees([]),
  });

  const fetchEmployees = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await routeApi.listEmployees();
      setEmployees(response.data.employees);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
      const timer = setInterval(() => fetchEmployees(true), 15000);
      return () => clearInterval(timer);
    }, [fetchEmployees]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Track Employees"
        subtitle="Live routes after check-in"
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
      />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchEmployees()} />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.employee._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchEmployees(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="map-marker-path"
              title="No employees"
              message="Active employees will appear here for route tracking."
            />
          }
          renderItem={({ item }) => (
            <TrackEmployeeRow
              item={item}
              onPress={() =>
                navigation.navigate('EmployeeRouteTrack', {
                  employeeId: item.employee._id,
                  employeeName: item.employee.fullName,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function TrackEmployeeRow({
  item,
  onPress,
}: {
  item: TrackableEmployee;
  onPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameWrap}>
          <MaterialCommunityIcons
            name="account-outline"
            size={22}
            color={theme.colors.primary}
          />
          <View style={styles.nameTextWrap}>
            <Text style={styles.name}>{item.employee.fullName}</Text>
            <Text style={styles.meta}>{item.employee.employeeId}</Text>
          </View>
        </View>
        {item.isLive ? <StatusBadge status="active" label="LIVE" /> : null}
      </View>
      {item.isLive && item.lastAddress ? (
        <Text style={styles.location} numberOfLines={2}>
          Last seen: {item.lastAddress}
        </Text>
      ) : null}
      {item.isLive && item.lastRecordedAt ? (
        <Text style={styles.meta}>
          Updated {formatDateTime(item.lastRecordedAt)} • {item.pointCount} points
        </Text>
      ) : (
        <Text style={styles.meta}>Not checked in today</Text>
      )}
      <Text style={styles.link} onPress={onPress}>
        View route & history →
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  nameWrap: { flexDirection: 'row', gap: theme.spacing.sm, flex: 1 },
  nameTextWrap: { flex: 1 },
  name: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  location: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  link: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
});
