import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, EmptyState, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { notificationApi } from '../../api/notificationApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime } from '../../utils/dates';
import type { Notification } from '../../types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';
import {
  getNotificationTargetLabel,
  navigateFromNotification,
} from '../../navigation/notificationNavigation';

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const userRole = useAuthStore(state => state.user?.role);
  const isAdmin = userRole === 'admin';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setNotifications([]),
  });

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await notificationApi.list({ page: 1, limit: 50 });
      setNotifications(response.data.items);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev =>
        prev.map(item => (item._id === id ? { ...item, isRead: true } : item)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleNotificationPress = async (item: Notification) => {
    if (!item.isRead) {
      await handleMarkRead(item._id);
    }

    if (!userRole) {
      return;
    }

    navigateFromNotification(item, userRole);
  };

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          isAdmin ? (
            <Pressable
              onPress={() => navigation.navigate('SendAnnouncement')}
              hitSlop={8}
              style={styles.headerActions}>
              <MaterialCommunityIcons name="bullhorn-outline" size={24} color={theme.colors.white} />
            </Pressable>
          ) : unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllRead} hitSlop={8}>
              <MaterialCommunityIcons name="check-all" size={24} color={theme.colors.white} />
            </Pressable>
          ) : undefined
        }
      />

      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchNotifications()} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} />
          }
          ListHeaderComponent={
            isAdmin && unreadCount > 0 ? (
              <Pressable style={styles.markAllRow} onPress={handleMarkAllRead}>
                <MaterialCommunityIcons name="check-all" size={18} color={theme.colors.primary} />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="bell-off-outline"
              title="No notifications"
              message="You're all caught up!"
            />
          }
          renderItem={({ item }) => {
            const targetLabel = getNotificationTargetLabel(item);
            return (
              <Pressable
                style={[styles.card, !item.isRead && styles.unreadCard]}
                onPress={() => void handleNotificationPress(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.isRead ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {targetLabel ? (
                  <View style={styles.targetRow}>
                    <Text style={styles.targetText}>{targetLabel}</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                ) : null}
                <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
              </Pressable>
            );
          }}
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
  headerActions: {
    marginLeft: theme.spacing.sm,
  },
  markAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  markAllText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unreadCard: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FBFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  message: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  targetText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  time: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
});
