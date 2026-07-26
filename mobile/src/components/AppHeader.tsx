import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({ title, subtitle, showBack, onBack, rightAction }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => onBack?.()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    marginTop: 2,
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
});
