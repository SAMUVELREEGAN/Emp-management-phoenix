import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
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
  employeeName?: string;
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

function LivePulse({ coordinate }: { coordinate: { latitude: number; longitude: number } }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpanded(current => !current);
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Circle
        center={coordinate}
        radius={22}
        fillColor="rgba(255, 193, 7, 0.18)"
        strokeColor="rgba(255, 193, 7, 0.45)"
        strokeWidth={2}
      />
      <Circle
        center={coordinate}
        radius={expanded ? 65 : 35}
        fillColor="rgba(211, 47, 47, 0.08)"
        strokeColor="rgba(211, 47, 47, 0.18)"
        strokeWidth={1}
      />
    </>
  );
}

export function RouteMapView({
  points,
  height = 360,
  showLegend = true,
  isLive = false,
  employeeName,
}: RouteMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const isFocused = useIsFocused();
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const showNativeMap = isFocused && !isLoggingOut;
  const [followLive, setFollowLive] = useState(isLive);
  const coordinates = useMemo(() => points.map(toCoordinate), [points]);
  const startPoint = points[0];
  const latestPoint = points[points.length - 1];
  const previousPoint = points.length > 1 ? points[points.length - 2] : null;

  useEffect(() => {
    setFollowLive(isLive);
  }, [isLive]);

  useEffect(() => {
    if (!showNativeMap || !mapRef.current || points.length === 0) {
      return;
    }

    if (followLive && isLive && latestPoint) {
      mapRef.current.animateToRegion(
        {
          latitude: latestPoint.latitude,
          longitude: latestPoint.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500,
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
  }, [coordinates, followLive, isLive, latestPoint, points.length, showNativeMap]);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={36} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>Waiting for live location...</Text>
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
            <>
              <Polyline
                coordinates={coordinates}
                strokeColor="rgba(0, 0, 0, 0.12)"
                strokeWidth={8}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={coordinates}
                strokeColor={theme.colors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          ) : null}

          {startPoint ? (
            <Marker
              coordinate={toCoordinate(startPoint)}
              anchor={{ x: 0.5, y: 1 }}
              title="Check-in"
              description={
                startPoint.address || `Checked in at ${formatTime(startPoint.recordedAt)}`
              }>
              <View style={styles.checkInMarker}>
                <MaterialCommunityIcons name="flag-checkered" size={16} color={theme.colors.white} />
              </View>
            </Marker>
          ) : null}

          {isLive && latestPoint ? <LivePulse coordinate={toCoordinate(latestPoint)} /> : null}

          {latestPoint ? (
            <Marker
              coordinate={toCoordinate(latestPoint)}
              anchor={{ x: 0.5, y: 0.5 }}
              title={employeeName || (isLive ? 'Live location' : 'Latest')}
              description={
                latestPoint.address ||
                (previousPoint
                  ? `Moving • ${formatTime(latestPoint.recordedAt)}`
                  : formatTime(latestPoint.recordedAt))
              }>
              <View style={styles.liveMarkerOuter}>
                <View style={styles.liveMarkerInner}>
                  <MaterialCommunityIcons
                    name={isLive ? 'motorbike' : 'map-marker'}
                    size={18}
                    color={theme.colors.white}
                  />
                </View>
              </View>
            </Marker>
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
          <Text style={styles.liveText}>LIVE TRACKING</Text>
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
          <LegendItem color={theme.colors.success} label="Check-in" />
          <LegendItem color={theme.colors.error} label={isLive ? 'Live rider' : 'Latest'} />
          <Text style={styles.pointCount}>
            {isLive ? 'Updating live' : `${points.length} points`}
          </Text>
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
      <Text style={styles.timelineTitle}>Route Timeline</Text>
      {points.map((point, index) => (
        <View key={`${point.sequence || index}-${point.recordedAt}`} style={styles.timelineRow}>
          <View
            style={[
              styles.timelineIndex,
              index === 0 && styles.timelineIndexStart,
              index === points.length - 1 && styles.timelineIndexLatest,
            ]}>
            <Text style={styles.timelineIndexText}>{index === 0 ? 'IN' : index + 1}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTime}>
              {index === 0 ? 'Check-in' : `Stop ${index}`} • {formatTime(point.recordedAt)}
            </Text>
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
  checkInMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  liveMarkerOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(211, 47, 47, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMarkerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIndexStart: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  timelineIndexLatest: {
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
  },
  timelineIndexText: {
    fontSize: 10,
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
