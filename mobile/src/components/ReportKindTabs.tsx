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
    <View style={styles.shell}>
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
  shell: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: '#EEF0F3',
    borderRadius: theme.radii.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  tabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.semibold,
  },
  tabTextActive: {
    color: theme.colors.accent,
  },
});
