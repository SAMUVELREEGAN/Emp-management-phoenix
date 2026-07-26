import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface DashboardMiniStatProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  iconBg: string;
}

export function DashboardMiniStat({ label, value, icon, color, iconBg }: DashboardMiniStatProps) {
  return (
    <View style={[styles.card, theme.shadows.card]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    minWidth: 72,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  label: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
