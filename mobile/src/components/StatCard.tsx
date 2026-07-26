import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  backgroundColor?: string;
  onPress?: () => void;
  selected?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  color = theme.colors.primary,
  backgroundColor = theme.colors.primaryLight,
  onPress,
  selected = false,
}: StatCardProps) {
  const content = (
    <>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[
          styles.card,
          { backgroundColor },
          selected && styles.cardSelected,
          selected && { borderColor: color },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, { backgroundColor }]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    ...theme.shadows.card,
  },
  value: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
