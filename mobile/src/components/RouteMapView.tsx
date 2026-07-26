import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { formatTime } from '../utils/dates';
import type { RoutePoint } from '../types';

interface RouteMapViewProps {
  points: RoutePoint[];
  height?: number;
  showLegend?: boolean;
  isLive?: boolean;
}

function toCoordinate(point: RoutePoint) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

function getInitialRegion(points: RoutePoint[]): Region {
  if (points.length === 0) {
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }

  const latest = points[points.length - 1];
  return {
    latitude: latest.latitude,
    longitude: latest.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
}

export function RouteMapView({
  points,
  height = 360,
  showLegend = true,
  isLive = false,
}: RouteMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const isFocused = useIsFocused();
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const showNativeMap = isFocused && !isLoggingOut;
  const [followLive, setFollowLive] = useState(isLive);
  const coordinates = useMemo(() => points.map(toCoordinate), [points]);
  const startPoint = points[0];
  const latestPoint = points[points.length - 1];

  useEffect(() => {
    setFollowLive(isLive);
  }, [isLive]);

  useEffect(() => {
    if (!showNativeMap || !mapRef.current || points.length === 0) {
      return;
    }

    if (followLive && isLive) {
      const latest = points[points.length - 1];
      mapRef.current.animateToRegion(
        {
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        450,
      );
      return;
    }

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        450,
      );
      return;
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 72, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [coordinates, followLive, isLive, points, showNativeMap]);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={36} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>No route points recorded yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      {showNativeMap ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={getInitialRegion(points)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
          showsScale
          rotateEnabled
          pitchEnabled
          onPanDrag={() => {
            if (isLive) {
              setFollowLive(false);
            }
          }}>
          {coordinates.length > 1 ? (
            <Polyline
              coordinates={coordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}

          {startPoint ? (
            <Marker
              coordinate={toCoordinate(startPoint)}
              title="Start"
              description={startPoint.address || `Checked in ${formatTime(startPoint.recordedAt)}`}
              pinColor={theme.colors.success}
            />
          ) : null}

          {latestPoint && points.length > 1 ? (
            <Marker
              coordinate={toCoordinate(latestPoint)}
              title={isLive ? 'Live location' : 'Latest'}
              description={latestPoint.address || formatTime(latestPoint.recordedAt)}
              pinColor={theme.colors.error}
            />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map-outline" size={28} color={theme.colors.textMuted} />
        </View>
      )}

      {isLive ? (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : null}

      {isLive ? (
        <Pressable
          style={[styles.recenterBtn, followLive && styles.recenterBtnActive]}
          onPress={() => setFollowLive(true)}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color={followLive ? theme.colors.white : theme.colors.primary}
          />
        </Pressable>
      ) : null}

      {showLegend ? (
        <View style={styles.legend}>
          <LegendItem color={theme.colors.success} label="Start" />
          <LegendItem color={theme.colors.error} label={isLive ? 'Live' : 'Latest'} />
          <Text style={styles.pointCount}>{points.length} points</Text>
        </View>
      ) : null}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

interface RouteTimelineProps {
  points: RoutePoint[];
}

export function RouteTimeline({ points }: RouteTimelineProps) {
  if (points.length === 0) {
    return null;
  }

  return (
    <View style={styles.timeline}>
      <Text style={styles.timelineTitle}>Route Stops</Text>
      {points.map((point, index) => (
        <View key={`${point.sequence || index}-${point.recordedAt}`} style={styles.timelineRow}>
          <View style={styles.timelineIndex}>
            <Text style={styles.timelineIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTime}>{formatTime(point.recordedAt)}</Text>
            <Text style={styles.timelineCoords}>
              {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
            </Text>
            {point.address ? (
              <Text style={styles.timelineAddress} numberOfLines={2}>
                {point.address}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.sizes.sm,
  },
  liveBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(211, 47, 47, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
  },
  liveText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    letterSpacing: 0.8,
  },
  recenterBtn: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  recenterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  legend: {
    position: 'absolute',
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  pointCount: {
    marginLeft: 'auto',
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  timeline: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  timelineIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIndexText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  timelineContent: { flex: 1 },
  timelineTime: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  timelineCoords: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  timelineAddress: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
