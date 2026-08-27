import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export type ReportKindTab = 'daily' | 'hourly';

interface ReportKindTabsProps {
  value: ReportKindTab;
  onChange: (value: ReportKindTab) => void;
  showHourly?: boolean;
}

export function ReportKindTabs({ value, onChange, showHourly = true }: ReportKindTabsProps) {
  if (!showHourly) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.tab, value === 'daily' && styles.tabActive]}
        onPress={() => onChange('daily')}>
        <Text style={[styles.tabText, value === 'daily' && styles.tabTextActive]}>Daily Reports</Text>
      </Pressable>
      <Pressable
        style={[styles.tab, value === 'hourly' && styles.tabActive]}
        onPress={() => onChange('hourly')}>
        <Text style={[styles.tabText, value === 'hourly' && styles.tabTextActive]}>GeoCam Hourly</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  tabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
});
