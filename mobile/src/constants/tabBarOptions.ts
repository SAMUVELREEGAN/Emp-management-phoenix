import React from 'react';
import { Platform } from 'react-native';
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { theme } from './theme';

const TAB_BODY_HEIGHT = Platform.OS === 'ios' ? 56 : 50;
const NOTCH_DEPTH = 22;
const BOTTOM_INSET = Platform.OS === 'ios' ? 24 : 6;

export const FLOATING_TAB_BAR_HEIGHT = TAB_BODY_HEIGHT + NOTCH_DEPTH + BOTTOM_INSET;

export function createFloatingTabBar(icons: Record<string, string>) {
  return function FloatingTabBarRenderer(props: BottomTabBarProps) {
    return React.createElement(FloatingTabBar, { ...props, icons });
  };
}

export function createTabBarScreenOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    lazy: true,
    freezeOnBlur: false,
    detachInactiveScreens: false,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      height: FLOATING_TAB_BAR_HEIGHT,
      backgroundColor: theme.colors.white,
      borderTopWidth: 0,
      overflow: 'visible',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        android: {
          elevation: 12,
        },
      }),
    },
  };
}
