import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

export interface DashboardTeamStatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  iconBg: string;
  accentColor?: string;
}

interface DashboardTeamStatsPanelProps {
  headline: DashboardTeamStatItem;
  metrics: DashboardTeamStatItem[];
}

export function DashboardTeamStatsPanel({ headline, metrics }: DashboardTeamStatsPanelProps) {
  return (
    <View style={styles.section}>
      <View style={styles.container}>
        <View style={styles.headlineCard}>
          <View style={styles.headlineGlow} />
          <View style={styles.headlineContent}>
            <View style={[styles.headlineIconWrap, { backgroundColor: headline.iconBg }]}>
              <MaterialCommunityIcons name={headline.icon} size={26} color={headline.color} />
            </View>
            <View style={styles.headlineText}>
              <Text style={styles.headlineLabel}>{headline.label}</Text>
              <Text style={styles.headlineValue}>{headline.value}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          {metrics.map(metric => (
            <View
              key={metric.label}
              style={[
                styles.metricCard,
                { borderTopColor: metric.accentColor ?? metric.color },
              ]}>
              <View style={[styles.metricIconWrap, { backgroundColor: metric.iconBg }]}>
                <MaterialCommunityIcons name={metric.icon} size={18} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                {metric.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    gap: theme.spacing.md,
  },
  headlineCard: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primaryLight,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFF0B3',
  },
  headlineGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.35)',
  },
  headlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headlineIconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  headlineText: {
    flex: 1,
  },
  headlineLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headlineValue: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderTopWidth: 3,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
