import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, AppInput, ErrorMessage } from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { validateRequired } from '../../validations';
import type { ProfileStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

interface EditProfileForm {
  fullName: string;
}

export default function EditProfileScreen({ navigation: _navigation }: Props) {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; type?: string; name?: string } | undefined>();
  const existingPhoto = user?.profilePhoto;

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ProfileMain' }],
    index: 0,
  });

  const { control, handleSubmit } = useForm<EditProfileForm>({
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setPhoto({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'profile.jpg',
        });
      }
    });
  };

  const onSubmit = async (values: EditProfileForm) => {
    if (!user) {
      return;
    }

    const trimmedName = values.fullName.trim();
    const nameChanged = trimmedName !== user.fullName;
    const photoChanged = Boolean(photo);

    if (!nameChanged && !photoChanged) {
      setError('Change your name or profile photo before saving.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authApi.updateProfile(
        nameChanged ? { fullName: trimmedName } : {},
        photo,
      );
      updateUser(response.data.user);
      Alert.alert('Profile Updated', 'Your name and photo have been updated everywhere in the app.', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const previewUri = photo?.uri
    ? photo.uri
    : existingPhoto
      ? `${UPLOADS_BASE_URL}${existingPhoto}`
      : undefined;

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Profile" showBack onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            You can update your display name and profile photo. Other details are managed by admin.
          </Text>

          <Pressable style={styles.photoSection} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.photoBadge}>
              <MaterialCommunityIcons name="camera" size={16} color={theme.colors.white} />
            </View>
            <Text style={styles.photoHint}>Tap to change profile photo</Text>
          </Pressable>

          <Controller
            control={control}
            name="fullName"
            rules={{ validate: v => validateRequired(v, 'Full name') }}
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <AppInput
                label="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter your full name"
                error={fieldState.error?.message}
                autoCapitalize="words"
              />
            )}
          />

          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyTitle}>Managed by admin</Text>
            <ReadOnlyRow label="Employee ID" value={user?.employeeId} />
            <ReadOnlyRow label="Email" value={user?.email} />
            <ReadOnlyRow label="Phone" value={user?.phone} />
            <ReadOnlyRow label="Department" value={user?.department} />
            <ReadOnlyRow label="Designation" value={user?.designation} />
          </View>

          {error ? <ErrorMessage message={error} /> : null}

          <AppButton
            title={loading ? 'Saving...' : 'Save Profile'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  hint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  photoSection: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: theme.radii.full,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    top: theme.spacing.lg + 74,
    right: '50%',
    marginRight: -62,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  photoHint: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  readOnlyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  readOnlyTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  readOnlyRow: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  readOnlyLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
  },
  readOnlyValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginTop: 2,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
});
