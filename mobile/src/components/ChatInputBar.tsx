import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  if (isRecording) {
    return (
      <View style={styles.recordingBar}>
        <Pressable onPress={onCancelVoice} hitSlop={8} style={styles.iconBtn}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.error} />
        </Pressable>
        <View style={styles.recordingCenter}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording {recordDuration}s</Text>
        </View>
        <Pressable onPress={onStopVoice} hitSlop={8} style={styles.sendVoiceBtn}>
          <MaterialCommunityIcons name="send" size={22} color={theme.colors.white} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolsRow}>
        <Pressable onPress={onPickPhoto} hitSlop={8} style={styles.toolBtn}>
          <MaterialCommunityIcons name="camera-image" size={22} color={theme.colors.primary} />
        </Pressable>
        <Pressable onPress={onPickAttachment} hitSlop={8} style={styles.toolBtn}>
          <MaterialCommunityIcons name="paperclip" size={22} color={theme.colors.primary} />
        </Pressable>
        <Pressable onPress={onStartVoice} hitSlop={8} style={styles.toolBtn}>
          <MaterialCommunityIcons name="microphone" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, (!value.trim() || sending) && styles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!value.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color={theme.colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  iconBtn: {
    padding: theme.spacing.xs,
  },
  recordingCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
  },
  recordingText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
  },
  sendVoiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
