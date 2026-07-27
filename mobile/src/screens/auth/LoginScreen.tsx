import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppInput, ErrorMessage } from '../../components';
import { theme } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { completeLoginSession } from '../../navigation/authSession';
import { getErrorMessage } from '../../utils/errors';
import {
  getIdentifierKeyboardType,
  validateLoginIdentifier,
  validatePassword,
} from '../../validations';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.login(values.identifier.trim(), values.password);
      const data = response.data;

      if ('requiresVerification' in data && data.requiresVerification) {
        if (data.devCode) {
          Alert.alert('Verification code', data.devCode);
        }

        navigation.navigate('VerifyCode', {
          identifier: values.identifier.trim(),
          channel: data.channel,
          maskedDestination: data.maskedDestination,
          devCode: data.devCode,
        });
        return;
      }

      completeLoginSession(data.token, data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MaterialCommunityIcons name="office-building" size={56} color={theme.colors.primary} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with email or mobile number</Text>
        </View>

        {error ? <ErrorMessage message={error} /> : null}

        <Controller
          control={control}
          name="identifier"
          rules={{ validate: validateLoginIdentifier }}
          render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput
              label="Email or Mobile Number"
              value={value}
              onChangeText={onChange}
              keyboardType={getIdentifierKeyboardType(value)}
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{ validate: value => validatePassword(value) }}
          render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput
              label="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              error={fieldError?.message}
            />
          )}
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        <AppButton title="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} />

        <Pressable
          onPress={() =>
            Alert.alert('Help', 'Use the email or mobile number and password provided by your administrator.')
          }>
          <Text style={styles.help}>Need help? Contact your admin.</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  forgot: {
    textAlign: 'right',
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.lg,
    fontWeight: theme.fonts.weights.medium,
  },
  help: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: theme.fonts.sizes.sm,
  },
});
