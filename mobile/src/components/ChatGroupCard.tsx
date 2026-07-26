import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { formatDateTime } from '../utils/dates';
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
      style={[styles.card, isTeam && styles.teamCard]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <View style={[styles.iconWrap, isTeam ? styles.teamIcon : styles.groupIcon]}>
        <MaterialCommunityIcons
          name={isTeam ? 'account-group' : 'forum-outline'}
          size={24}
          color={isTeam ? theme.colors.white : theme.colors.primary}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {group.name}
          </Text>
          {group.lastMessageAt ? (
            <Text style={styles.time}>{formatDateTime(group.lastMessageAt)}</Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {getPreview(group)}
          </Text>
          <View style={styles.badgeRow}>
            {isTeam ? (
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeText}>Team</Text>
              </View>
            ) : (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{group.memberCount || 0}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  teamCard: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FBFF',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  teamIcon: {
    backgroundColor: theme.colors.primary,
  },
  groupIcon: {
    backgroundColor: theme.colors.primaryLight,
  },
  content: {
    flex: 1,
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
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  time: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: theme.spacing.sm,
  },
  preview: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  teamBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  teamBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  countBadge: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countBadgeText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
});
