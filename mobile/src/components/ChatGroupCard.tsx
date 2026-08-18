import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';
import { formatTime } from '../utils/dates';
import type { ChatGroup } from '../types';

interface ChatGroupCardProps {
  group: ChatGroup;
  onPress: () => void;
  onLongPress?: () => void;
}

function getPreview(group: ChatGroup): string {
  if (group.lastMessagePreview) {
    return group.lastMessagePreview;
  }
  return group.isTeamChat ? 'Company-wide team conversation' : 'No messages yet';
}

export function ChatGroupCard({ group, onPress, onLongPress }: ChatGroupCardProps) {
  const isTeam = group.isTeamChat || group.type === 'team';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isTeam && styles.teamCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <View style={[styles.iconWrap, isTeam ? styles.teamIcon : styles.groupIcon]}>
        <MaterialCommunityIcons
          name={isTeam ? 'account-group' : 'forum-outline'}
          size={24}
          color={isTeam ? chatTheme.accent : chatTheme.ownBubble}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {group.name}
          </Text>
          {group.lastMessageAt ? (
            <Text style={styles.time}>{formatTime(group.lastMessageAt)}</Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {getPreview(group)}
          </Text>
          <View style={styles.badgeRow}>
            {isTeam ? (
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeText}>Everyone</Text>
              </View>
            ) : (
              <View style={styles.countBadge}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={12}
                  color={chatTheme.otherBubbleMeta}
                />
                <Text style={styles.countBadgeText}>{group.memberCount || 0}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.chevronWrap}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={chatTheme.otherBubbleMeta} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: chatTheme.inputBackground,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...chatTheme.shadow,
  },
  teamCard: {
    borderColor: 'rgba(184, 134, 11, 0.25)',
    backgroundColor: chatTheme.accentSoft,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  teamIcon: {
    backgroundColor: chatTheme.ownBubble,
    borderWidth: 2,
    borderColor: chatTheme.accent,
  },
  groupIcon: {
    backgroundColor: chatTheme.hubBackground,
    borderWidth: 1,
    borderColor: chatTheme.inputBorder,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.otherBubbleText,
  },
  time: {
    fontSize: theme.fonts.sizes.xs,
    color: chatTheme.otherBubbleMeta,
    fontWeight: theme.fonts.weights.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: theme.spacing.sm,
  },
  preview: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: chatTheme.otherBubbleMeta,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  teamBadge: {
    backgroundColor: chatTheme.ownBubble,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  teamBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.accent,
    letterSpacing: 0.3,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: chatTheme.hubBackground,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: chatTheme.inputBorder,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: chatTheme.otherBubbleMeta,
  },
  chevronWrap: {
    marginLeft: theme.spacing.xs,
  },
});
