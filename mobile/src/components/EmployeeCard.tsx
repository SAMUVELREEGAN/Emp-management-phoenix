import React from 'react';
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

export function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
  const photoUri = employee.profilePhoto
    ? `${UPLOADS_BASE_URL}${employee.profilePhoto}`
    : undefined;

  const content = (
    <View style={styles.row}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={28} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{employee.fullName}</Text>
        <Text style={styles.meta}>{employee.employeeId} • {employee.department}</Text>
        <Text style={styles.meta}>{employee.designation}</Text>
        {employee.role === 'hr' ? <Text style={styles.hrTag}>HR</Text> : null}
      </View>
      <StatusBadge status={employee.status} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  hrTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
});
