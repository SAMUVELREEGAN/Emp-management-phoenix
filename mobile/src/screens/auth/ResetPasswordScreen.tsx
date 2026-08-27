import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ErrorMessage } from '../../components';
import { theme } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../utils/errors';
import { validateNewPassword } from '../../validations';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

interface ResetPasswordForm {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email, maskedDestination, devCode } = route.params;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit } = useForm<ResetPasswordForm>({
    defaultValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordForm) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({
        email,
        code: values.code.trim(),
        newPassword: values.newPassword,
      });
      Alert.alert(
        'Password Updated',
        'Your password has been reset successfully. Sign in with your new password.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset password'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const response = await authApi.forgotPassword({ email });
      if (response.data.devCode) {
        Alert.alert('Dev reset code', response.data.devCode);
      } else {
        Alert.alert('Code sent', `A new reset code was sent to ${maskedDestination}.`);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Reset Password" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {maskedDestination}, then choose a new password.
          </Text>

          {devCode ? <Text style={styles.devHint}>Dev code: {devCode}</Text> : null}

          {error ? <ErrorMessage message={error} /> : null}

          <Controller
            control={control}
            name="code"
            rules={{
              validate: value =>
                value.trim().length === 6 ? true : 'Enter the 6-digit verification code',
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <AppInput
                label="Verification Code"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            rules={{ validate: validateNewPassword }}
            render={({ field: { onChange, value }, fieldState }) => (
              <AppInput
                label="New Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                placeholder="At least 8 characters"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              validate: value =>
                value.trim().length > 0 ? true : 'Confirm your new password',
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <AppInput
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={fieldState.error?.message}
              />
            )}
          />

          <AppButton
            title="Reset Password"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.button}
          />

          <AppButton
            title="Resend Code"
            variant="outline"
            onPress={handleResend}
            loading={resending}
          />
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
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  devHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.warning,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
});
