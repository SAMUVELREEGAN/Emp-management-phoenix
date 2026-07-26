import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({ message = 'Loading...', fullScreen = false }: LoadingIndicatorProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
