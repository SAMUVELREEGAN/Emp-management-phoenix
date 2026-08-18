import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface TabBarIconProps {
  iconName: string;
  focused: boolean;
}

function resolveIconName(iconName: string, focused: boolean): string {
  if (!focused) {
    return iconName;
  }

  if (iconName === 'dots-grid') {
    return 'view-grid';
  }

  if (iconName.endsWith('-outline')) {
    return iconName.replace('-outline', '');
  }

  return iconName;
}

export function TabBarIcon({ iconName, focused }: TabBarIconProps) {
  const resolvedName = resolveIconName(iconName, focused);
  const iconColor = focused ? theme.colors.primaryDark : theme.colors.textMuted;

  return (
    <View style={[styles.shell, focused ? styles.shellActive : null]}>
      <MaterialCommunityIcons
        name={resolvedName}
        size={focused ? 23 : 21}
        color={iconColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minWidth: 46,
    height: 32,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  shellActive: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
});
