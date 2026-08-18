import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickPhoto: () => void;
  onPickAttachment: () => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onCancelVoice: () => void;
  sending?: boolean;
  isRecording?: boolean;
  recordDuration?: number;
}

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onPickPhoto,
  onPickAttachment,
  onStartVoice,
  onStopVoice,
  onCancelVoice,
  sending = false,
  isRecording = false,
  recordDuration = 0,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0;

  if (isRecording) {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.recordingBar, chatTheme.inputShadow]}>
          <Pressable onPress={onCancelVoice} hitSlop={8} style={styles.cancelBtn}>
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.error} />
          </Pressable>
          <View style={styles.recordingCenter}>
            <View style={styles.recordingPulse}>
              <View style={styles.recordingDot} />
            </View>
            <Text style={styles.recordingText}>Recording {recordDuration}s</Text>
          </View>
          <Pressable onPress={onStopVoice} hitSlop={8} style={styles.sendVoiceBtn}>
            <MaterialCommunityIcons name="send" size={20} color={chatTheme.ownBubble} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, chatTheme.inputShadow]}>
        <View style={styles.toolsRow}>
          <Pressable onPress={onPickPhoto} hitSlop={6} style={styles.toolBtn}>
            <MaterialCommunityIcons name="image-outline" size={22} color={chatTheme.senderName} />
          </Pressable>
          <Pressable onPress={onPickAttachment} hitSlop={6} style={styles.toolBtn}>
            <MaterialCommunityIcons name="paperclip" size={22} color={chatTheme.senderName} />
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="Message..."
            placeholderTextColor={chatTheme.otherBubbleMeta}
            multiline
            maxLength={2000}
          />
        </View>

        {canSend ? (
          <Pressable
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color={chatTheme.ownBubble} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={chatTheme.ownBubble} />
            )}
          </Pressable>
        ) : (
          <Pressable onPress={onStartVoice} hitSlop={6} style={styles.micBtn}>
            <MaterialCommunityIcons name="microphone" size={22} color={chatTheme.ownBubbleText} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: chatTheme.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: chatTheme.inputBackground,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: chatTheme.inputBorder,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    maxHeight: 120,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: theme.fonts.sizes.md,
    color: chatTheme.otherBubbleText,
    lineHeight: 22,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: chatTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: chatTheme.ownBubble,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: chatTheme.inputBackground,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.errorLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.errorLight,
  },
  recordingCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  recordingPulse: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  recordingText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: chatTheme.otherBubbleText,
  },
  sendVoiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: chatTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
