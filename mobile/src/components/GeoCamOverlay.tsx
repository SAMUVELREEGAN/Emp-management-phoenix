import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { formatDateTime } from '../utils/dates';
import { isLowAccuracyGeoCamLocation } from '../utils/location';
import type { LocationPayload } from '../types';

interface GeoCamOverlayProps {
  location: LocationPayload;
  capturedAt?: string;
  compact?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function GeoCamOverlay({
  location,
  capturedAt,
  compact = false,
  onRefresh,
  refreshing = false,
}: GeoCamOverlayProps) {
  const address = location.address?.trim() || 'Fetching location...';
  const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  const accuracy =
    location.accuracy != null && Number.isFinite(location.accuracy)
      ? `±${Math.round(location.accuracy)}m`
      : 'GPS';
  const timeLabel = capturedAt ? formatDateTime(capturedAt) : formatDateTime(new Date().toISOString());
  const lowAccuracy = isLowAccuracyGeoCamLocation(location.accuracy);

  const content = (
    <>
      <View style={styles.badgeRow}>
        <MaterialCommunityIcons name="crosshairs-gps" size={16} color={theme.colors.primary} />
        <Text style={styles.badgeText}>GEO CAM • FIELD HOURLY REPORT</Text>
        {onRefresh && !compact ? (
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={refreshing ? theme.colors.textMuted : theme.colors.white}
            style={styles.refreshIcon}
          />
        ) : null}
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {address}
      </Text>
      <Text style={styles.meta}>
        {coords} • {accuracy}
      </Text>
      {lowAccuracy && !compact ? (
        <Text style={styles.warning}>
          Low GPS accuracy. Move outdoors or tap to refresh for a better location.
        </Text>
      ) : null}
      <Text style={styles.meta}>{timeLabel}</Text>
      {onRefresh && !compact ? (
        <Text style={styles.refreshHint}>
          {refreshing ? 'Refreshing location...' : 'Tap to refresh location'}
        </Text>
      ) : null}
    </>
  );

  if (onRefresh && !compact) {
    return (
      <Pressable
        onPress={onRefresh}
        disabled={refreshing}
        style={({ pressed }) => [
          styles.wrap,
          pressed && !refreshing ? styles.wrapPressed : null,
        ]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.wrap, compact && styles.wrapCompact]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.84)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: 6,
  },
  wrapCompact: {
    borderRadius: 0,
  },
  wrapPressed: {
    opacity: 0.92,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  refreshIcon: {
    marginLeft: 'auto',
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    letterSpacing: 0.6,
  },
  address: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    lineHeight: 22,
  },
  meta: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: theme.fonts.sizes.xs,
    lineHeight: 18,
  },
  warning: {
    color: '#fbbf24',
    fontSize: theme.fonts.sizes.xs,
    lineHeight: 18,
  },
  refreshHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: theme.fonts.sizes.xs,
    marginTop: 2,
  },
});
