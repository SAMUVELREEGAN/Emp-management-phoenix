import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';
import { formatVoiceDuration } from '../utils/voiceDuration';

const WAVE_HEIGHTS = [4, 8, 12, 6, 14, 10, 16, 8, 12, 18, 10, 14, 8, 12, 6, 16, 10, 14, 8, 12, 6, 10, 14, 8];

interface VoiceMessagePlayerProps {
  isOwn: boolean;
  durationSeconds: number;
  attachmentUrl: string;
  isActive: boolean;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onPress: () => void;
}

export function VoiceMessagePlayer({
  isOwn,
  durationSeconds,
  isActive,
  isPlaying,
  positionMs,
  durationMs,
  onPress,
}: VoiceMessagePlayerProps) {
  const progress =
    isActive && durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const timeLabel = useMemo(() => {
    const totalSec =
      Math.floor((isActive && durationMs > 0 ? durationMs : durationSeconds * 1000) / 1000) ||
      durationSeconds;
    if (isActive && durationMs > 0) {
      const currentSec = Math.min(totalSec, Math.floor(positionMs / 1000));
      return `${formatVoiceDuration(currentSec)} / ${formatVoiceDuration(totalSec)}`;
    }
    return formatVoiceDuration(durationSeconds);
  }, [durationMs, durationSeconds, isActive, positionMs]);

  const activeBars = Math.max(1, Math.round(progress * WAVE_HEIGHTS.length));

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={[styles.playBtn, isOwn ? styles.playBtnOwn : styles.playBtnOther]}>
        <MaterialCommunityIcons
          name={isActive && isPlaying ? 'pause' : 'play'}
          size={22}
          color={isOwn ? chatTheme.waPlayOwn : chatTheme.waPlayOther}
        />
      </View>

      <View style={styles.waveWrap}>
        <View style={styles.waveRow}>
          {WAVE_HEIGHTS.map((height, index) => {
            const filled = index < activeBars;
            return (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height,
                    backgroundColor: filled
                      ? isOwn
                        ? chatTheme.waPlayOwn
                        : chatTheme.waPlayOther
                      : isOwn
                        ? 'rgba(0,0,0,0.18)'
                        : 'rgba(0,0,0,0.12)',
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.duration, isOwn ? styles.durationOwn : styles.durationOther]}>
          {timeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minWidth: 200,
    paddingVertical: 2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnOwn: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  playBtnOther: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  waveWrap: {
    flex: 1,
    minWidth: 0,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 22,
    marginBottom: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    fontWeight: theme.fonts.weights.medium,
  },
  durationOwn: {
    color: 'rgba(0,0,0,0.55)',
  },
  durationOther: {
    color: chatTheme.otherBubbleMeta,
  },
});
