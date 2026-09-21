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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.headerAccent} />
        </View>

        <View style={styles.grid}>
          {items.map(item => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.label}>
              <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerAccent: {
    width: 36,
    height: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
  },
  tile: {
    width: '31.5%',
    minHeight: 104,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  tilePressed: {
    backgroundColor: '#F1F5F9',
    borderColor: theme.colors.border,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
  },
  label: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
