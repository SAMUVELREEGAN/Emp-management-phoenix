import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from './theme';

export function createTabBarScreenOptions(icons: Record<string, string>) {
  return ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    lazy: true,
    freezeOnBlur: true,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginBottom: 2,
    },
    tabBarStyle: {
      backgroundColor: theme.colors.white,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      paddingBottom: 6,
      paddingTop: 4,
      height: 62,
      elevation: 8,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    tabBarIcon: ({ color, size }: { color: string; size: number }) =>
      React.createElement(MaterialCommunityIcons, {
        name: icons[route.name] || 'circle',
        size,
        color,
      }),
  });
}
