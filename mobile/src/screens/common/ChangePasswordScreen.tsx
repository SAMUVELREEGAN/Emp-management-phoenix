import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ErrorMessage } from '../../components';
import { theme } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../utils/errors';
import { validateNewPassword, validatePassword, validateRequired } from '../../validations';
import type { ProfileStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen({ navigation: _navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ProfileMain' }],
    index: 0,
  });

  const { control, handleSubmit, reset } = useForm<ChangePasswordForm>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordForm) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => handleBack() },
      ]);
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Change Password" showBack onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <ErrorMessage message={error} /> : null}

          <Controller
            control={control}
            name="currentPassword"
            rules={{ validate: v => validateRequired(v, 'Current password') }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput
                label="Current Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={fieldError?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            rules={{ validate: validateNewPassword }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput
                label="New Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={fieldError?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{ validate: value => validatePassword(value) }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={fieldError?.message}
              />
            )}
          />

          <AppButton title="Update Password" onPress={handleSubmit(onSubmit)} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
});
