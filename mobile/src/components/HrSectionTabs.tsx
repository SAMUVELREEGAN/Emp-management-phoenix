import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export type HrSectionTab = 'left' | 'middle' | 'right';

interface HrSectionTabsProps {
  value: HrSectionTab;
  onChange: (value: HrSectionTab) => void;
  leftLabel: string;
  rightLabel: string;
  middleLabel?: string;
  threeTabs?: boolean;
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function HrSectionTabs({
  value,
  onChange,
  leftLabel,
  rightLabel,
  middleLabel,
  threeTabs = false,
}: HrSectionTabsProps) {
  if (threeTabs && middleLabel) {
    return (
      <View style={styles.shell}>
        <TabButton label={leftLabel} active={value === 'left'} onPress={() => onChange('left')} />
        <TabButton
          label={middleLabel}
          active={value === 'middle'}
          onPress={() => onChange('middle')}
        />
        <TabButton label={rightLabel} active={value === 'right'} onPress={() => onChange('right')} />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <TabButton label={leftLabel} active={value === 'left'} onPress={() => onChange('left')} />
      <TabButton label={rightLabel} active={value === 'right'} onPress={() => onChange('right')} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    backgroundColor: '#EEF0F3',
    borderRadius: theme.radii.lg,
    padding: 4,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
