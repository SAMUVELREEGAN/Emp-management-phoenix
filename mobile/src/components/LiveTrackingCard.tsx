import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiveTrackingIllustration } from './LiveTrackingIllustration';
import { theme } from '../constants/theme';

interface LiveTrackingCardProps {
  onPress: () => void;
}

export function LiveTrackingCard({ onPress }: LiveTrackingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Live Tracking</Text>
          <View style={styles.headerAccent} />
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Employee routes</Text>
          <Text style={styles.detailTitle}>Track field staff</Text>
          <Text style={styles.detailSub}>View real-time location on map</Text>
          <View style={styles.updatedRow}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.updatedText}>Tap to open live map</Text>
          </View>
        </View>

        <View style={styles.illustrationWrap}>
          <LiveTrackingIllustration />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
        accessibilityRole="button">
        <MaterialCommunityIcons name="map-outline" size={20} color={theme.colors.text} />
        <Text style={styles.buttonText}>View Live Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerAccent: {
    width: 36,
    height: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.info,
    marginTop: 4,
  },
  detailSub: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  updatedText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
});
