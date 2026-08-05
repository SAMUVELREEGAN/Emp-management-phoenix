import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, ConfirmationModal } from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { performLogout } from '../../navigation/authSession';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../utils/roles';
import { formatDate } from '../../utils/dates';
import type {
  AdminTabParamList,
  EmployeeTabParamList,
  HrTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { useMoreHubBack } from '../../navigation/safeStackBack';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>,
  BottomTabScreenProps<EmployeeTabParamList | AdminTabParamList | HrTabParamList, 'More'>
>;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore(state => state.user);
  const setLoggingOut = useAuthStore(state => state.setLoggingOut);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const { handleBack } = useMoreHubBack();

  const handleConfirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    setLogoutPending(true);
    setLoggingOut(true);

    setTimeout(() => {
      void performLogout().finally(() => {
        setLogoutPending(false);
      });
    }, 450);
  }, [setLoggingOut]);

  if (!user) {
    return <View style={styles.container} collapsable={false} />;
  }

  const photoUri = user.profilePhoto ? `${UPLOADS_BASE_URL}${user.profilePhoto}` : undefined;

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="Profile" subtitle={getRoleLabel(user.role)} showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
            </View>
          )}
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.role}>{user.role.toUpperCase()}</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="badge-account" label="Employee ID" value={user.employeeId} />
          <InfoRow icon="email-outline" label="Email" value={user.email} />
          <InfoRow icon="phone-outline" label="Phone" value={user.phone} />
          <InfoRow icon="domain" label="Department" value={user.department} />
          <InfoRow icon="briefcase-outline" label="Designation" value={user.designation} />
          <InfoRow icon="calendar" label="Joining Date" value={formatDate(user.joiningDate)} />
          {user.address ? <InfoRow icon="map-marker-outline" label="Address" value={user.address} /> : null}
        </View>

        <AppButton
          title="Change Password"
          variant="outline"
          onPress={() => navigation.navigate('ChangePassword')}
          style={styles.button}
        />
        <AppButton
          title="Logout"
          variant="danger"
          onPress={() => setShowLogoutConfirm(true)}
          style={styles.button}
        />
      </ScrollView>

      <ConfirmationModal
        inline
        visible={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive
        loading={logoutPending}
        onConfirm={handleConfirmLogout}
        onCancel={() => {
          if (!logoutPending) {
            setShowLogoutConfirm(false);
          }
        }}
      />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.full,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  role: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginTop: 2,
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
});
