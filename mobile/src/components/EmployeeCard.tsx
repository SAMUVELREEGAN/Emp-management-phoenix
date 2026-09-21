import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UPLOADS_BASE_URL } from '../constants/config';
import { theme } from '../constants/theme';
import type { User } from '../types';
import { StatusBadge } from './StatusBadge';

interface EmployeeCardProps {
  employee: User;
  onPress?: () => void;
}

function EmployeeAvatar({ photoUri, name }: { photoUri?: string; name: string }) {
  const [imageError, setImageError] = useState(false);
  const showPhoto = Boolean(photoUri) && !imageError;

  return (
    <View style={styles.avatarRing}>
      {showPhoto ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.avatar}
          onError={() => setImageError(true)}
          accessibilityLabel={`${name} profile photo`}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={30} color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

export function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
  const photoUri = employee.profilePhoto
    ? `${UPLOADS_BASE_URL}${employee.profilePhoto}`
    : undefined;

  const content = (
    <View style={styles.row}>
      <EmployeeAvatar photoUri={photoUri} name={employee.fullName} />

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {employee.fullName}
          </Text>
          <StatusBadge status={employee.status} />
        </View>

        <Text style={styles.metaPrimary} numberOfLines={1}>
          {employee.employeeId} • {employee.department}
        </Text>
        <Text style={styles.metaSecondary} numberOfLines={1}>
          {employee.designation}
        </Text>
        {employee.role === 'hr' ? <Text style={styles.hrTag}>HR</Text> : null}
      </View>

      {onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.textMuted}
          style={styles.chevron}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardPressed: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
    transform: [{ scale: 0.995 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: 2,
    backgroundColor: theme.colors.white,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  metaPrimary: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.medium,
    marginTop: 2,
  },
  metaSecondary: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  hrTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  chevron: {
    marginLeft: -theme.spacing.xs,
  },
});
