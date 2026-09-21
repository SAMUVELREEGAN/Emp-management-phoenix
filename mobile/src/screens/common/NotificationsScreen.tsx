import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  NotificationCard,
} from '../../components';
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
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const listRequestId = useRef(0);

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setNotifications([]),
  });

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    const requestId = ++listRequestId.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await notificationApi.list({ page: 1, limit: 50 });
      if (requestId !== listRequestId.current) {
        return;
      }
      setNotifications(response.data.items);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      if (requestId !== listRequestId.current) {
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      if (requestId === listRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
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

  const handleClearAll = () => {
    Alert.alert('Clear all notifications?', 'This will permanently remove all notifications.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setClearing(true);
            setError('');
            listRequestId.current += 1;
            try {
              await notificationApi.deleteAll();
              const verifyId = ++listRequestId.current;
              const response = await notificationApi.list({ page: 1, limit: 50 });
              if (verifyId !== listRequestId.current) {
                return;
              }
              setNotifications(response.data.items);
              setUnreadCount(response.data.unreadCount);
            } catch (err) {
              const message = getErrorMessage(err);
              setError(message);
              Alert.alert('Could not clear notifications', message);
              void fetchNotifications(true);
            } finally {
              setClearing(false);
            }
          })();
        },
      },
    ]);
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

  const showToolbar = notifications.length > 0;

  const listHeader = showToolbar ? (
    <View style={styles.toolbarCard}>
      <View style={styles.toolbarTop}>
        <View style={styles.inboxBadge}>
          <MaterialCommunityIcons name="inbox-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.inboxBadgeText}>
            {notifications.length} notification{notifications.length === 1 ? '' : 's'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.toolbarActions}>
        {unreadCount > 0 ? (
          <Pressable style={styles.actionButton} onPress={() => void handleMarkAllRead()}>
            <MaterialCommunityIcons name="check-all" size={18} color={theme.colors.accent} />
            <Text style={styles.actionButtonText}>Mark all as read</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleClearAll}
          disabled={clearing}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
          <Text style={styles.actionButtonTextDanger}>Clear all</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

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
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="Send announcement">
              <MaterialCommunityIcons name="bullhorn-outline" size={24} color={theme.colors.text} />
            </Pressable>
          ) : undefined
        }
      />

      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error && notifications.length === 0 ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchNotifications()} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} />
          }
          ListHeaderComponent={
            <>
              {error && notifications.length > 0 ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}
              {listHeader}
            </>
          }
          ListEmptyComponent={
            <EmptyState
              icon="bell-off-outline"
              title="No notifications"
              message="You're all caught up!"
            />
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              targetLabel={getNotificationTargetLabel(item)}
              timeLabel={formatDateTime(item.createdAt)}
              onPress={() => void handleNotificationPress(item)}
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
    backgroundColor: '#F6F7F9',
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  toolbarCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  toolbarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  inboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  inboxBadgeText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  unreadPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
  },
  unreadPillText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.accent,
  },
  toolbarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: '#F3F4F6',
  },
  actionButtonDanger: {
    backgroundColor: theme.colors.errorLight,
  },
  actionButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.accent,
  },
  actionButtonTextDanger: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.error,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.25)',
  },
  errorBannerText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.fonts.weights.medium,
  },
});
