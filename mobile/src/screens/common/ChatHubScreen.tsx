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
import { chatTheme } from '../../constants/chatTheme';
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
              style={styles.headerAction}>
              <MaterialCommunityIcons name="plus-circle-outline" size={26} color={theme.colors.white} />
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
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchGroups(true)} />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <MaterialCommunityIcons
                      name="account-voice"
                      size={16}
                      color={chatTheme.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Team Chat</Text>
                </View>
                {teamChat ? (
                  <ChatGroupCard group={teamChat} onPress={() => openThread(teamChat)} />
                ) : (
                  <EmptyState
                    icon="account-group-outline"
                    title="Team chat loading"
                    message="Pull to refresh if team chat does not appear."
                  />
                )}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <MaterialCommunityIcons
                      name="forum-outline"
                      size={16}
                      color={chatTheme.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Group Chats</Text>
                  {isAdmin ? (
                    <Pressable
                      style={styles.createInlineBtn}
                      onPress={() => navigation.navigate('CreateChatGroup')}>
                      <MaterialCommunityIcons name="plus" size={16} color={chatTheme.ownBubble} />
                      <Text style={styles.createInlineText}>New Group</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="chat-outline"
              title="No group chats yet"
              message={
                isAdmin
                  ? 'Create a group and add employees or HR members.'
                  : 'Your admin has not added you to a group yet.'
              }
            />
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
    backgroundColor: chatTheme.hubBackground,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerAction: {
    marginLeft: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: chatTheme.ownBubble,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: chatTheme.accent,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.otherBubbleText,
    letterSpacing: 0.4,
  },
  createInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: chatTheme.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    ...chatTheme.shadow,
  },
  createInlineText: {
    fontSize: theme.fonts.sizes.xs,
    color: chatTheme.ownBubble,
    fontWeight: theme.fonts.weights.bold,
  },
});
