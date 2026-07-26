import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export type HrSectionTab = 'left' | 'right';

interface HrSectionTabsProps {
  value: HrSectionTab;
  onChange: (value: HrSectionTab) => void;
  leftLabel: string;
  rightLabel: string;
}

export function HrSectionTabs({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: HrSectionTabsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.tab, value === 'left' && styles.tabActive]}
        onPress={() => onChange('left')}>
        <Text style={[styles.tabText, value === 'left' && styles.tabTextActive]}>
          {leftLabel}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, value === 'right' && styles.tabActive]}
        onPress={() => onChange('right')}>
        <Text style={[styles.tabText, value === 'right' && styles.tabTextActive]}>
          {rightLabel}
        </Text>
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
