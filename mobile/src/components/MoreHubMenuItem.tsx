import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

export interface MoreHubMenuItemData {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  iconBg: string;
  badge?: number;
}

interface MoreHubMenuItemProps {
  item: MoreHubMenuItemData;
  onPress: () => void;
}

export function MoreHubMenuItem({ item, onPress }: MoreHubMenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={[styles.accent, { backgroundColor: item.color }]} />

      <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
        <MaterialCommunityIcons name={item.icon} size={23} color={item.color} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
      </View>

      <View style={styles.trailing}>
        {item.badge && item.badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
          </View>
        ) : null}
        <View style={styles.chevronBtn}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.text} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    paddingVertical: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingLeft: theme.spacing.md + 2,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.9,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
  },
});
