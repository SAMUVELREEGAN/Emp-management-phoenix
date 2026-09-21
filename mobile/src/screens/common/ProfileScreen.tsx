import React, { useCallback } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader } from '../../components';
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
import { useQuickAccessBack } from '../../navigation/safeStackBack';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>,
  BottomTabScreenProps<EmployeeTabParamList | AdminTabParamList | HrTabParamList, 'More'>
>;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore(state => state.user);
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: true });

  const handleLogoutPress = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          const runLogout = () => {
            void performLogout();
          };
          if (Platform.OS === 'android') {
            setTimeout(runLogout, 150);
          } else {
            runLogout();
          }
        },
      },
    ]);
  }, []);

  if (!user) {
    return <View style={styles.container} collapsable={false} />;
  }

  const photoUri = user.profilePhoto ? `${UPLOADS_BASE_URL}${user.profilePhoto}` : undefined;

  const detailRows = [
    { icon: 'badge-account', label: 'Employee ID', value: user.employeeId },
    { icon: 'email-outline', label: 'Email', value: user.email },
    { icon: 'phone-outline', label: 'Phone', value: user.phone },
    { icon: 'domain', label: 'Department', value: user.department },
    { icon: 'briefcase-outline', label: 'Designation', value: user.designation },
    { icon: 'calendar', label: 'Joining Date', value: formatDate(user.joiningDate) },
    ...(user.address ? [{ icon: 'map-marker-outline', label: 'Address', value: user.address }] : []),
  ];

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Profile"
        subtitle={getRoleLabel(user.role)}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileCardAccent} />
          <View style={styles.avatarRing}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={52} color={theme.colors.primaryDark} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.role}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {detailRows.map((row, index) => (
            <InfoRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              isLast={index === detailRows.length - 1}
            />
          ))}
        </View>

        <View style={styles.actionsCard}>
          <AppButton
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.button}
          />
          <AppButton
            title="Change Password"
            variant="outline"
            onPress={() => navigation.navigate('ChangePassword')}
            style={styles.button}
          />
          <AppButton title="Logout" variant="danger" onPress={handleLogoutPress} />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: string;
  label: string;
  value: string;
  isLast: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primaryDark} />
      </View>
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
    backgroundColor: '#F6F7F9',
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  profileCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: theme.colors.primaryLight,
    opacity: 0.65,
  },
  avatarRing: {
    padding: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.full,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
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
  rolePill: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  role: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.accent,
    fontWeight: theme.fonts.weights.bold,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md + 2,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.medium,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginTop: 4,
    fontWeight: theme.fonts.weights.semibold,
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.card,
    gap: theme.spacing.sm,
  },
  button: {
    marginBottom: 0,
  },
});
