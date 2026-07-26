import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

export interface QuickAccessItem {
  key: string;
  label: string;
  icon: string;
  color: string;
  iconBg: string;
  badge?: number;
  onPress: () => void;
}

interface QuickAccessGridProps {
  title?: string;
  items: QuickAccessItem[];
}

export function QuickAccessGrid({ title = 'Quick Access', items }: QuickAccessGridProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {items.map(item => (
          <Pressable
            key={item.key}
            style={[styles.card, theme.shadows.card]}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              {item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    width: '31%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
  },
  label: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
