import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Pressable style={styles.container} onPress={onRetry} disabled={!onRetry}>
      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <Text style={styles.retry}>Tap to retry</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  text: {
    flex: 1,
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
  },
  retry: {
    width: '100%',
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.medium,
  },
});
