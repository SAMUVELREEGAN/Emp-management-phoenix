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
import { formatVoiceDuration } from '../utils/voiceDuration';

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
        <View style={styles.recordingBar}>
          <Pressable onPress={onCancelVoice} hitSlop={8} style={styles.cancelBtn}>
            <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
          </Pressable>
          <View style={styles.recordingCenter}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{formatVoiceDuration(recordDuration)}</Text>
            <Text style={styles.recordingHint}>Slide to cancel • Release to send</Text>
          </View>
          <Pressable onPress={onStopVoice} hitSlop={8} style={styles.sendVoiceBtn}>
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Pressable onPress={onPickAttachment} hitSlop={6} style={styles.sideBtn}>
          <MaterialCommunityIcons name="plus" size={26} color={chatTheme.otherBubbleMeta} />
        </Pressable>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="Message"
            placeholderTextColor={chatTheme.otherBubbleMeta}
            multiline
            maxLength={2000}
          />
          <Pressable onPress={onPickPhoto} hitSlop={6} style={styles.inlineIcon}>
            <MaterialCommunityIcons name="camera-outline" size={22} color={chatTheme.otherBubbleMeta} />
          </Pressable>
        </View>

        {canSend ? (
          <Pressable
            style={[styles.actionBtn, sending && styles.actionBtnDisabled]}
            onPress={onSend}
            disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        ) : (
          <Pressable onPress={onStartVoice} hitSlop={6} style={styles.actionBtn}>
            <MaterialCommunityIcons name="microphone" size={22} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    backgroundColor: '#F0F2F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  sideBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    minHeight: 44,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: theme.fonts.sizes.md,
    color: chatTheme.otherBubbleText,
    lineHeight: 22,
  },
  inlineIcon: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: chatTheme.waSend,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
    marginBottom: 2,
  },
  recordingText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: chatTheme.otherBubbleText,
  },
  recordingHint: {
    fontSize: 10,
    color: chatTheme.otherBubbleMeta,
  },
  sendVoiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: chatTheme.waSend,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
