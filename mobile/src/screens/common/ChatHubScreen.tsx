import React, { useCallback, useState } from 'react';
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

export default function ChatHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
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

  const teamChat = groups.find(group => group.type === 'team' || group.isTeamChat);
  const groupChats = groups.filter(group => group.type === 'group');

  const openThread = (group: ChatGroup) => {
    setActiveThread({
      groupId: group._id,
      groupName: group.name,
      isTeamChat: group.type === 'team',
    });
  };

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
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-voice" size={18} color={theme.colors.primary} />
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

              <View style={[styles.sectionHeader, styles.sectionSpacing]}>
                <MaterialCommunityIcons name="forum-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Group Chats</Text>
                {isAdmin ? (
                  <Pressable
                    style={styles.createInlineBtn}
                    onPress={() => navigation.navigate('CreateChatGroup')}>
                    <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
                    <Text style={styles.createInlineText}>New Group</Text>
                  </Pressable>
                ) : null}
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
    backgroundColor: theme.colors.surface,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sectionSpacing: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  createInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  createInlineText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
});
