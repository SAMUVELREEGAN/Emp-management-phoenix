import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AiHubIllustration, type AiHubIllustrationVariant } from './AiHubIllustration';
import { theme } from '../constants/theme';

interface MoreHubAiFeatureCardProps {
  title: string;
  subtitle: string;
  variant: AiHubIllustrationVariant;
  onPress: () => void;
}

export function MoreHubAiFeatureCard({
  title,
  subtitle,
  variant,
  onPress,
}: MoreHubAiFeatureCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={styles.content}>
        <View style={styles.textColumn}>
          <View style={styles.aiTag}>
            <View style={styles.aiDot} />
            <Text style={styles.aiTagText}>AI</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Open</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.accent} />
          </View>
        </View>

        <View style={styles.artColumn}>
          <View style={styles.artRing} />
          <AiHubIllustration variant={variant} size={92} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: '#FFFCF2',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.992 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    minHeight: 132,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: theme.spacing.sm,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: theme.spacing.sm,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.accent,
  },
  artColumn: {
    width: 98,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artRing: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});
