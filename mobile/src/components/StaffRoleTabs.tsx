import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export type StaffRoleTab = 'employee' | 'hr';

interface StaffRoleTabsProps {
  value: StaffRoleTab;
  onChange: (value: StaffRoleTab) => void;
}

export function StaffRoleTabs({ value, onChange }: StaffRoleTabsProps) {
  return (
    <View style={styles.shell}>
      <Pressable
        style={[styles.tab, value === 'employee' && styles.tabActive]}
        onPress={() => onChange('employee')}>
        <Text style={[styles.tabText, value === 'employee' && styles.tabTextActive]}>Employees</Text>
      </Pressable>
      <Pressable
        style={[styles.tab, value === 'hr' && styles.tabActive]}
        onPress={() => onChange('hr')}>
        <Text style={[styles.tabText, value === 'hr' && styles.tabTextActive]}>HR</Text>
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
