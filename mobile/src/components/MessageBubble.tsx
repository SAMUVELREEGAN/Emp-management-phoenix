import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';
import { UPLOADS_BASE_URL } from '../constants/config';
import { formatTime } from '../utils/dates';
import { getChatAvatarColors, getChatSenderName } from '../utils/chat';
import type { ChatMessage } from '../types';
import type { VoicePlaybackState } from '../hooks/useVoiceRecorder';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onPlayVoice?: (uri: string, durationSeconds?: number) => void;
  playback?: VoicePlaybackState | null;
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

function isPdfAttachment(message: ChatMessage): boolean {
  const name = message.attachmentName?.toLowerCase() || '';
  const mime = message.attachmentMimeType?.toLowerCase() || '';
  return mime.includes('pdf') || name.endsWith('.pdf');
}

export function MessageBubble({
  message,
  isOwn,
  onPlayVoice,
  playback,
  showMedia = true,
}: MessageBubbleProps) {
  const attachmentUrl = getAttachmentUrl(message.attachmentUrl);
  const senderName = getSenderName(message.sender);
  const avatarColors = getChatAvatarColors(senderName);
  const timeLabel = formatTime(message.createdAt);
  const isPdf = message.messageType === 'file' && isPdfAttachment(message);

  const openAttachment = () => {
    if (attachmentUrl) {
      void Linking.openURL(attachmentUrl);
    }
  };

  const voiceActive = Boolean(
    attachmentUrl && playback?.uri && playback.uri === attachmentUrl,
  );

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
              style={[styles.fileCard, isPdf && styles.pdfCard]}
              onPress={openAttachment}>
              <View style={[styles.fileIconWrap, isPdf ? styles.pdfIconWrap : styles.docIconWrap]}>
                <MaterialCommunityIcons
                  name={isPdf ? 'file-pdf-box' : 'file-document-outline'}
                  size={isPdf ? 28 : 24}
                  color={isPdf ? '#FFFFFF' : chatTheme.waPlayOther}
                />
              </View>
              <View style={styles.fileMeta}>
                <Text
                  style={[styles.fileName, isOwn ? styles.textOwn : styles.textOther]}
                  numberOfLines={2}>
                  {message.attachmentName || (isPdf ? 'Document.pdf' : 'Attachment')}
                </Text>
                <Text style={[styles.fileSub, isOwn ? styles.captionOwn : styles.captionOther]}>
                  {isPdf ? 'PDF • Tap to open' : 'Tap to download'}
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
            <VoiceMessagePlayer
              isOwn={isOwn}
              durationSeconds={message.voiceDuration || 1}
              attachmentUrl={attachmentUrl}
              isActive={voiceActive}
              isPlaying={voiceActive && Boolean(playback?.isPlaying)}
              positionMs={voiceActive ? playback?.positionMs || 0 : 0}
              durationMs={
                voiceActive && playback?.durationMs
                  ? playback.durationMs
                  : (message.voiceDuration || 1) * 1000
              }
              onPress={() => onPlayVoice?.(attachmentUrl, message.voiceDuration)}
            />
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>{timeLabel}</Text>
          </View>
        </View>
        {isOwn ? <View style={styles.tailOwn} /> : <View style={styles.tailOther} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm + 2,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 4,
  },
  avatarText: {
    fontWeight: theme.fonts.weights.bold,
    fontSize: theme.fonts.sizes.xs,
  },
  bubbleWrap: {
    maxWidth: '82%',
    position: 'relative',
  },
  bubbleWrapOwn: {
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  bubble: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    elevation: 1,
  },
  bubbleOwn: {
    backgroundColor: chatTheme.ownBubble,
    borderTopRightRadius: 0,
  },
  bubbleOther: {
    backgroundColor: chatTheme.otherBubble,
    borderTopLeftRadius: 0,
  },
  tailOwn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: chatTheme.ownBubble,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
  },
  tailOther: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: chatTheme.otherBubble,
    borderRightWidth: 8,
    borderRightColor: 'transparent',
  },
  sender: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.waPlayOther,
    marginBottom: 2,
  },
  text: {
    fontSize: theme.fonts.sizes.md,
    lineHeight: 21,
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
    lineHeight: 18,
  },
  captionOwn: {
    color: chatTheme.ownBubbleMeta,
  },
  captionOther: {
    color: chatTheme.otherBubbleMeta,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: {
    fontSize: 10,
  },
  timeOwn: {
    color: chatTheme.ownBubbleMeta,
  },
  timeOther: {
    color: chatTheme.otherBubbleMeta,
  },
  mediaBlock: {
    overflow: 'hidden',
    borderRadius: 6,
    marginBottom: 2,
  },
  image: {
    width: 240,
    height: 180,
    borderRadius: 6,
    backgroundColor: chatTheme.background,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 220,
  },
  pdfCard: {
    paddingVertical: 6,
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfIconWrap: {
    backgroundColor: '#E53935',
  },
  docIconWrap: {
    backgroundColor: '#E7EDF2',
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
  },
  fileSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
