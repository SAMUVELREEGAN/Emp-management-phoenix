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
    <View style={styles.row}>
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
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
