import React from 'react';
import { Platform } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { TabBarIcon } from '../components/TabBarIcon';
import { theme } from './theme';

export function createTabBarScreenOptions(
  icons: Record<string, string>,
): (args: { route: { name: string } }) => BottomTabNavigationOptions {
  return ({ route }) => ({
    headerShown: false,
    lazy: true,
    freezeOnBlur: false,
    detachInactiveScreens: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: theme.colors.primaryDark,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarIcon: ({ focused }) =>
      React.createElement(TabBarIcon, {
        iconName: icons[route.name] ?? 'circle-outline',
        focused,
      }),
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: theme.fonts.weights.semibold,
      marginTop: 2,
      letterSpacing: 0.2,
    },
    tabBarItemStyle: {
      paddingTop: 4,
    },
    tabBarStyle: {
      backgroundColor: theme.colors.white,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 88 : 72,
      paddingBottom: Platform.OS === 'ios' ? 26 : 10,
      paddingTop: 8,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
        },
        android: {
          elevation: 16,
        },
      }),
    },
  });
}
