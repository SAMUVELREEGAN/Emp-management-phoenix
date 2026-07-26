import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface LiveTrackingCardProps {
  onPress: () => void;
}

export function LiveTrackingCard({ onPress }: LiveTrackingCardProps) {
  return (
    <View style={[styles.card, theme.shadows.card]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live Tracking</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map-marker-radius" size={36} color={theme.colors.info} />
          <MaterialCommunityIcons
            name="car-side"
            size={28}
            color={theme.colors.info}
            style={styles.carIcon}
          />
        </View>
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Employee routes</Text>
          <Text style={styles.detailTitle}>Track field staff</Text>
          <Text style={styles.detailSub}>View real-time location on map</Text>
          <View style={styles.updatedRow}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.updatedText}>Tap to open live map</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.button} onPress={onPress} accessibilityRole="button">
        <MaterialCommunityIcons name="map-outline" size={20} color={theme.colors.text} />
        <Text style={styles.buttonText}>View Live Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.semibold,
  },
  body: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  mapPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  carIcon: {
    position: 'absolute',
    bottom: 12,
    right: 10,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  detailTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.info,
    marginTop: 2,
  },
  detailSub: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginTop: 2,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
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
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  buttonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
});
