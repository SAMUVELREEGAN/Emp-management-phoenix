import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, ChatGroupCard, EmptyState, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { chatApi } from '../../api/chatApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import type { ChatGroup } from '../../types';
import type { ChatStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';
import { ChatThreadPanel } from './ChatThreadPanel';

interface ActiveThread {
  groupId: string;
  groupName: string;
  isTeamChat: boolean;
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionAccent} />
      </View>
      {action}
    </View>
  );
}

export default function ChatHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatHub'>>();
  const pendingGroupId = route.params?.groupId;
  const isAdmin = useAuthStore(state => state.user?.role === 'admin');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    onBeforeBack: () => setGroups([]),
  });

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const response = await chatApi.listGroups();
      setGroups(response.data.groups);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!activeThread) {
        fetchGroups();
      }
      const timer = setInterval(() => {
        if (!activeThread) {
          fetchGroups(true);
        }
      }, 8000);
      return () => clearInterval(timer);
    }, [activeThread, fetchGroups]),
  );

  const openThread = useCallback(
    (group: ChatGroup) => {
      setActiveThread({
        groupId: group._id,
        groupName: group.name,
        isTeamChat: group.type === 'team',
      });
      if (route.params?.groupId) {
        navigation.setParams({ groupId: undefined });
      }
    },
    [navigation, route.params?.groupId],
  );

  useEffect(() => {
    if (!pendingGroupId || activeThread || groups.length === 0) {
      return;
    }

    const group = groups.find(item => item._id === pendingGroupId);
    if (group) {
      openThread(group);
    }
  }, [pendingGroupId, groups, activeThread, openThread]);

  const teamChat = groups.find(group => group.type === 'team' || group.isTeamChat);
  const groupChats = groups.filter(group => group.type === 'group');

  const handleDeleteGroup = (group: ChatGroup) => {
    Alert.alert('Delete group', `Delete "${group.name}" and all its messages?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatApi.deleteGroup(group._id);
            fetchGroups(true);
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleEditGroup = (group: ChatGroup) => {
    navigation.navigate('CreateChatGroup', { groupId: group._id });
  };

  const newGroupButton = isAdmin ? (
    <Pressable
      style={styles.createBtn}
      onPress={() => navigation.navigate('CreateChatGroup')}
      accessibilityRole="button">
      <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text} />
      <Text style={styles.createBtnText}>New Group</Text>
    </Pressable>
  ) : null;

  if (activeThread) {
    return (
      <ChatThreadPanel
        groupId={activeThread.groupId}
        groupName={activeThread.groupName}
        isTeamChat={activeThread.isTeamChat}
        onBack={() => {
          setActiveThread(null);
          fetchGroups(true);
        }}
      />
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Communication"
        subtitle="Team chat & groups"
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          isAdmin ? (
            <Pressable
              onPress={() => navigation.navigate('CreateChatGroup')}
              hitSlop={8}
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Create chat group">
              <View style={styles.headerActionCircle}>
                <MaterialCommunityIcons name="plus" size={22} color={theme.colors.text} />
              </View>
            </Pressable>
          ) : undefined
        }
      />

      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchGroups()} />
        </View>
      ) : (
        <FlatList
          data={groupChats}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchGroups(true)} />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.sectionCard}>
                <SectionHeader title="Team Chat" />
                {teamChat ? (
                  <ChatGroupCard group={teamChat} onPress={() => openThread(teamChat)} />
                ) : (
                  <View style={styles.inlineEmpty}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={28}
                      color={theme.colors.textMuted}
                    />
                    <Text style={styles.inlineEmptyTitle}>Team chat loading</Text>
                    <Text style={styles.inlineEmptyText}>Pull to refresh if team chat does not appear.</Text>
                  </View>
                )}
              </View>

              <View style={styles.groupSectionHeader}>
                <SectionHeader title="Group Chats" action={newGroupButton} />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <EmptyState
                icon="chat-outline"
                title="No group chats yet"
                message={
                  isAdmin
                    ? 'Create a group and add employees or HR members.'
                    : 'Your admin has not added you to a group yet.'
                }
              />
            </View>
          }
          renderItem={({ item }) => (
            <ChatGroupCard
              group={item}
              onPress={() => openThread(item)}
              onLongPress={
                isAdmin
                  ? () =>
                      Alert.alert(item.name, 'Manage this group', [
                        { text: 'Edit', onPress: () => handleEditGroup(item) },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteGroup(item) },
                        { text: 'Cancel', style: 'cancel' },
                      ])
                  : undefined
              }
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
    backgroundColor: theme.colors.surface,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerAction: {
    marginLeft: theme.spacing.sm,
  },
  headerActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  groupSectionHeader: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  sectionAccent: {
    width: 36,
    height: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    marginTop: 2,
  },
  createBtnText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.bold,
  },
  inlineEmpty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  inlineEmptyTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  inlineEmptyText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
});
