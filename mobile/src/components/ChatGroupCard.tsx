import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
      {isTeam ? <View style={styles.teamAccent} /> : null}

      <View style={[styles.iconRing, isTeam ? styles.teamIconRing : styles.groupIconRing]}>
        <View style={[styles.iconWrap, isTeam ? styles.teamIcon : styles.groupIcon]}>
          <MaterialCommunityIcons
            name={isTeam ? 'account-group' : 'forum-outline'}
            size={22}
            color={isTeam ? theme.colors.text : theme.colors.primary}
          />
        </View>
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
                color={theme.colors.textSecondary}
              />
                <Text style={styles.countBadgeText}>{group.memberCount || 0}</Text>
            </View>
          )}
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
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  teamCard: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: '#FFF0B3',
  },
  teamAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    marginRight: theme.spacing.md,
  },
  teamIconRing: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  groupIconRing: {
    borderWidth: 2,
    borderColor: '#EEF2F6',
    backgroundColor: '#F8FAFC',
  },
  iconWrap: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamIcon: {
    backgroundColor: theme.colors.white,
  },
  groupIcon: {
    backgroundColor: '#F8FAFC',
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
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  time: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.semibold,
  },
  preview: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  teamBadge: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  teamBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: 0.3,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
  },
});
