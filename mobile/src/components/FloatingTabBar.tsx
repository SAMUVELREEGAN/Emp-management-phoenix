import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../constants/theme';

const NOTCH_RADIUS = 28;
const BAR_TOP = 18;
const NOTCH_CURVE = 12;
const CORNER_RADIUS = 20;
const TAB_BODY_HEIGHT = Platform.OS === 'ios' ? 58 : 54;
const NOTCH_DEPTH = NOTCH_RADIUS * 0.8;

interface FloatingTabBarProps extends BottomTabBarProps {
  icons: Record<string, string>;
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

function getTabLabel(
  label: string | ((props: { focused: boolean; color: string; position: 'beside-icon' | 'below-icon'; children: string }) => React.ReactNode) | undefined,
  title: string | undefined,
  routeName: string,
): string {
  if (typeof label === 'string') {
    return label;
  }
  if (title) {
    return title;
  }
  return routeName;
}

function createTabBarPath(width: number, svgHeight: number, centerX: number): string {
  const startNotch = Math.max(CORNER_RADIUS, centerX - NOTCH_RADIUS - NOTCH_CURVE);
  const endNotch = Math.min(width - CORNER_RADIUS, centerX + NOTCH_RADIUS + NOTCH_CURVE);

  return `
    M 0 ${BAR_TOP + CORNER_RADIUS}
    Q 0 ${BAR_TOP} ${CORNER_RADIUS} ${BAR_TOP}
    L ${startNotch} ${BAR_TOP}
    C ${centerX - NOTCH_RADIUS - NOTCH_CURVE / 2} ${BAR_TOP},
      ${centerX - NOTCH_RADIUS} ${BAR_TOP + NOTCH_DEPTH},
      ${centerX} ${BAR_TOP + NOTCH_DEPTH}
    C ${centerX + NOTCH_RADIUS} ${BAR_TOP + NOTCH_DEPTH},
      ${centerX + NOTCH_RADIUS + NOTCH_CURVE / 2} ${BAR_TOP},
      ${endNotch} ${BAR_TOP}
    L ${width - CORNER_RADIUS} ${BAR_TOP}
    Q ${width} ${BAR_TOP} ${width} ${BAR_TOP + CORNER_RADIUS}
    L ${width} ${svgHeight}
    L 0 ${svgHeight}
    Z
  `;
}

export function FloatingTabBar({ state, descriptors, navigation, icons }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const width = Dimensions.get('window').width;
  const tabCount = state.routes.length;
  const tabWidth = width / tabCount;
  const activeIndex = state.index;
  const centerX = tabWidth * activeIndex + tabWidth / 2;
  const barBottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 18) : Math.max(insets.bottom, 6);
  const tabBottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 2;
  const contentHeight = TAB_BODY_HEIGHT + barBottomPad;
  const svgHeight = contentHeight + NOTCH_DEPTH;
  const totalHeight = svgHeight;

  const path = useMemo(
    () => createTabBarPath(width, svgHeight, centerX),
    [width, svgHeight, centerX],
  );

  return (
    <View style={[styles.wrapper, { height: totalHeight, width }]}>
      <View style={[styles.barLayer, { height: svgHeight, width }]}>
        <Svg width={width} height={svgHeight} style={styles.svg}>
          <Path d={path} fill={theme.colors.white} />
        </Svg>
      </View>

      <View style={[styles.tabsRow, { paddingBottom: tabBottomPad }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = icons[route.name] ?? 'circle-outline';
          const resolvedIcon = resolveIconName(iconName, isFocused);
          const label = getTabLabel(options.tabBarLabel, options.title, route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}>
              <View style={[styles.tabSlot, isFocused && styles.tabSlotActive]}>
                <MaterialCommunityIcons
                  name={resolvedIcon}
                  size={isFocused ? 24 : 22}
                  color={isFocused ? theme.colors.primaryDark : theme.colors.textMuted}
                />
                <Text style={isFocused ? styles.activeLabel : styles.inactiveLabel}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  barLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  svg: {
    position: 'absolute',
    bottom: 0,
  },
  tabsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 3,
  },
  tabSlotActive: {
    marginBottom: NOTCH_DEPTH + 8,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primaryDark,
    letterSpacing: 0.2,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textMuted,
    letterSpacing: 0.2,
  },
});
