import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { UPLOADS_BASE_URL } from '../constants/config';
import { formatDateTime } from '../utils/dates';
import { getChatSenderName } from '../utils/chat';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onPlayVoice?: (uri: string) => void;
  showMedia?: boolean;
}

function getSenderName(sender: ChatMessage['sender']): string {
  return getChatSenderName(sender);
}

function getAttachmentUrl(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${UPLOADS_BASE_URL}${path}`;
}

export function MessageBubble({ message, isOwn, onPlayVoice, showMedia = true }: MessageBubbleProps) {
  const attachmentUrl = getAttachmentUrl(message.attachmentUrl);
  const senderName = getSenderName(message.sender);

  const openAttachment = () => {
    if (attachmentUrl) {
      void Linking.openURL(attachmentUrl);
    }
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
        </View>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn ? <Text style={styles.sender}>{senderName}</Text> : null}

        {message.messageType === 'text' ? (
          <Text style={[styles.text, isOwn && styles.textOwn]}>{message.content}</Text>
        ) : null}

        {message.messageType === 'image' && attachmentUrl && showMedia ? (
          <Pressable onPress={openAttachment}>
            <Image source={{ uri: attachmentUrl }} style={styles.image} resizeMode="cover" />
            {message.content ? (
              <Text style={[styles.caption, isOwn && styles.textOwn]}>{message.content}</Text>
            ) : null}
          </Pressable>
        ) : null}

        {message.messageType === 'file' && attachmentUrl ? (
          <Pressable style={styles.fileCard} onPress={openAttachment}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={28}
              color={isOwn ? theme.colors.white : theme.colors.primary}
            />
            <View style={styles.fileMeta}>
              <Text style={[styles.fileName, isOwn && styles.textOwn]} numberOfLines={2}>
                {message.attachmentName || 'Attachment'}
              </Text>
              {message.content ? (
                <Text style={[styles.caption, isOwn && styles.textOwn]}>{message.content}</Text>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        {message.messageType === 'voice' && attachmentUrl ? (
          <Pressable style={styles.voiceCard} onPress={() => onPlayVoice?.(attachmentUrl)}>
            <MaterialCommunityIcons
              name="play-circle"
              size={32}
              color={isOwn ? theme.colors.white : theme.colors.primary}
            />
            <View style={styles.fileMeta}>
              <Text style={[styles.fileName, isOwn && styles.textOwn]}>Voice message</Text>
              {message.voiceDuration ? (
                <Text style={[styles.caption, isOwn && styles.textOwn]}>
                  {message.voiceDuration}s
                </Text>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatDateTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 4,
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
    fontSize: theme.fonts.sizes.sm,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  text: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  textOwn: {
    color: theme.colors.white,
  },
  caption: {
    marginTop: 4,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  time: {
    marginTop: 6,
    fontSize: 10,
    color: theme.colors.textMuted,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minWidth: 160,
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
  },
});
