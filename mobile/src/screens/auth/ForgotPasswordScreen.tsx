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
import { validateEmail } from '../../validations';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    setLoading(true);
    setError('');
    try {
      const email = values.email.trim().toLowerCase();
      const response = await authApi.forgotPassword({ email });

      if (response.data.devCode) {
        Alert.alert('Dev reset code', response.data.devCode);
      }

      navigation.navigate('ResetPassword', {
        email,
        maskedDestination: response.data.maskedDestination,
        devCode: response.data.devCode,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send reset code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Forgot Password" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter the email address linked to your employee account. We will send a 6-digit
            verification code to that email.
          </Text>

          {error ? <ErrorMessage message={error} /> : null}

          <Controller
            control={control}
            name="email"
            rules={{ validate: validateEmail }}
            render={({ field: { onChange, value }, fieldState }) => (
              <AppInput
                label="Email Address"
                value={value}
                onChangeText={onChange}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={fieldState.error?.message}
              />
            )}
          />

          <AppButton
            title="Send Reset Code"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.button}
          />

          <AppButton
            title="Back to Login"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
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
  button: {
    marginBottom: theme.spacing.sm,
  },
});
