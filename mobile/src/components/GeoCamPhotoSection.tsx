import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UPLOADS_BASE_URL } from '../constants/config';
import { theme } from '../constants/theme';
import { formatDateTime } from '../utils/dates';
import type { WorkReport } from '../types';

interface GeoCamPhotoSectionProps {
  report: WorkReport;
}

export function GeoCamPhotoSection({ report }: GeoCamPhotoSectionProps) {
  if (!report.attachment) {
    return null;
  }

  const photoUri = report.attachment.startsWith('http')
    ? report.attachment
    : `${UPLOADS_BASE_URL}${report.attachment}`;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>GeoCam Photo</Text>
      <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
      {report.geoLocation ? (
        <View style={styles.metaBox}>
          {report.geoLocation.address ? (
            <Text style={styles.address}>{report.geoLocation.address}</Text>
          ) : null}
          <Text style={styles.meta}>
            {report.geoLocation.latitude.toFixed(6)}, {report.geoLocation.longitude.toFixed(6)}
          </Text>
          {report.geoLocation.accuracy != null ? (
            <Text style={styles.meta}>
              GPS accuracy: ±{Math.round(report.geoLocation.accuracy)} meters
            </Text>
          ) : null}
          {report.geoLocation.capturedAt ? (
            <Text style={styles.meta}>
              Captured {formatDateTime(report.geoLocation.capturedAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  photo: {
    width: '100%',
    height: 360,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  metaBox: {
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  address: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    lineHeight: 20,
  },
  meta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
