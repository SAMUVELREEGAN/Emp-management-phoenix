import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';
import { UPLOADS_BASE_URL } from '../constants/config';
import { formatTime } from '../utils/dates';
import { getChatAvatarColors, getChatSenderName } from '../utils/chat';
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
  const avatarColors = getChatAvatarColors(senderName);
  const timeLabel = formatTime(message.createdAt);

  const openAttachment = () => {
    if (attachmentUrl) {
      void Linking.openURL(attachmentUrl);
    }
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn ? (
        <View style={[styles.avatar, { backgroundColor: avatarColors.bg }]}>
          <Text style={[styles.avatarText, { color: avatarColors.text }]}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
      ) : null}
      <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn ? <Text style={styles.sender}>{senderName}</Text> : null}

          {message.messageType === 'text' ? (
            <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
              {message.content}
            </Text>
          ) : null}

          {message.messageType === 'image' && attachmentUrl && showMedia ? (
            <Pressable onPress={openAttachment} style={styles.mediaBlock}>
              <Image source={{ uri: attachmentUrl }} style={styles.image} resizeMode="cover" />
              {message.content ? (
                <Text style={[styles.caption, isOwn ? styles.captionOwn : styles.captionOther]}>
                  {message.content}
                </Text>
              ) : null}
            </Pressable>
          ) : null}

          {message.messageType === 'file' && attachmentUrl ? (
            <Pressable
              style={[styles.fileCard, isOwn ? styles.fileCardOwn : styles.fileCardOther]}
              onPress={openAttachment}>
              <View style={[styles.fileIconWrap, isOwn && styles.fileIconWrapOwn]}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={22}
                  color={isOwn ? chatTheme.ownBubbleText : chatTheme.senderName}
                />
              </View>
              <View style={styles.fileMeta}>
                <Text
                  style={[styles.fileName, isOwn ? styles.textOwn : styles.textOther]}
                  numberOfLines={2}>
                  {message.attachmentName || 'Attachment'}
                </Text>
                {message.content ? (
                  <Text style={[styles.caption, isOwn ? styles.captionOwn : styles.captionOther]}>
                    {message.content}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          {message.messageType === 'voice' && attachmentUrl ? (
            <Pressable
              style={[styles.voiceCard, isOwn ? styles.voiceCardOwn : styles.voiceCardOther]}
              onPress={() => onPlayVoice?.(attachmentUrl)}>
              <MaterialCommunityIcons
                name="play-circle"
                size={34}
                color={isOwn ? chatTheme.accent : chatTheme.senderName}
              />
              <View style={styles.fileMeta}>
                <Text style={[styles.fileName, isOwn ? styles.textOwn : styles.textOther]}>
                  Voice message
                </Text>
                {message.voiceDuration ? (
                  <Text style={[styles.caption, isOwn ? styles.captionOwn : styles.captionOther]}>
                    {message.voiceDuration}s
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>{timeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  avatarText: {
    fontWeight: theme.fonts.weights.bold,
    fontSize: theme.fonts.sizes.sm,
  },
  bubbleWrap: {
    maxWidth: '80%',
  },
  bubbleWrapOwn: {
    alignItems: 'flex-end',
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    minWidth: 72,
  },
  bubbleOwn: {
    backgroundColor: chatTheme.ownBubble,
    borderBottomRightRadius: 6,
    ...chatTheme.shadow,
  },
  bubbleOther: {
    backgroundColor: chatTheme.otherBubble,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...chatTheme.shadow,
  },
  sender: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.senderName,
    marginBottom: 4,
  },
  text: {
    fontSize: theme.fonts.sizes.md,
    lineHeight: 22,
  },
  textOwn: {
    color: chatTheme.ownBubbleText,
  },
  textOther: {
    color: chatTheme.otherBubbleText,
  },
  caption: {
    marginTop: 4,
    fontSize: theme.fonts.sizes.sm,
    lineHeight: 20,
  },
  captionOwn: {
    color: chatTheme.ownBubbleMeta,
  },
  captionOther: {
    color: chatTheme.otherBubbleMeta,
  },
  time: {
    marginTop: 6,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: chatTheme.ownBubbleMeta,
  },
  timeOther: {
    color: chatTheme.otherBubbleMeta,
  },
  mediaBlock: {
    overflow: 'hidden',
    borderRadius: theme.radii.md,
  },
  image: {
    width: 228,
    height: 168,
    borderRadius: theme.radii.md,
    backgroundColor: chatTheme.background,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xs,
    minWidth: 180,
  },
  fileCardOwn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  fileCardOther: {
    backgroundColor: chatTheme.hubBackground,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chatTheme.accentSoft,
  },
  fileIconWrapOwn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minWidth: 168,
    borderRadius: theme.radii.md,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  voiceCardOwn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  voiceCardOther: {
    backgroundColor: chatTheme.hubBackground,
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
});
