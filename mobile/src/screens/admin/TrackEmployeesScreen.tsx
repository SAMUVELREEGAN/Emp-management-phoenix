import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
} from '../../components';
import { theme } from '../../constants/theme';
import { routeApi } from '../../api/routeApi';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/dates';
import type { TrackableEmployee } from '../../types';
import type { AdminTrackStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

const AVATAR_PALETTE = [
  { bg: '#FFF3CD', text: '#7A5C00' },
  { bg: '#E8F4FD', text: '#1565C0' },
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
];

function avatarColors(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

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
      const timer = setInterval(() => fetchEmployees(true), 5000);
      return () => clearInterval(timer);
    }, [fetchEmployees]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Track Field Employees"
        subtitle="Live GPS routes for field sales staff"
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
              title="No field employees"
              message="Mark employees as Field Sales during account creation to enable live route tracking."
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
  const colors = avatarColors(item.employee.fullName);
  const statusLine =
    item.isLive && item.lastRecordedAt
      ? `Updated ${formatDateTime(item.lastRecordedAt)} • ${item.pointCount} points`
      : 'Not checked in today';

  return (
    <View style={[styles.card, item.isLive && styles.cardLive]}>
      {item.isLive ? <View style={styles.liveStripe} /> : null}

      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>
            {item.employee.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameTextWrap}>
          <Text style={styles.name}>{item.employee.fullName}</Text>
          <Text style={styles.employeeId}>{item.employee.employeeId}</Text>
        </View>
        {item.isLive ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        ) : null}
      </View>

      {item.isLive && item.lastAddress ? (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.location} numberOfLines={2}>
            Last seen: {item.lastAddress}
          </Text>
        </View>
      ) : null}

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.meta}>{statusLine}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
        onPress={onPress}
        accessibilityRole="button">
        <Text style={styles.actionText}>View route & history →</Text>
      </Pressable>
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
    padding: theme.spacing.md,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardLive: {
    borderColor: 'rgba(40, 167, 69, 0.25)',
  },
  liveStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.success,
    borderTopLeftRadius: theme.radii.xl,
    borderBottomLeftRadius: theme.radii.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
  },
  nameTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  employeeId: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: theme.fonts.weights.medium,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.35)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.success,
    letterSpacing: 0.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  location: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  meta: {
    flex: 1,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
  },
  actionBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.accent,
  },
});
