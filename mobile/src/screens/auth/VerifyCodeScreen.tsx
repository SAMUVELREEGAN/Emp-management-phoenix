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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ErrorMessage } from '../../components';
import { theme } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { completeLoginSession } from '../../navigation/authSession';
import { getErrorMessage } from '../../utils/errors';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyCode'>;

export default function VerifyCodeScreen({ navigation, route }: Props) {
  const { identifier, channel, maskedDestination, devCode } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const channelLabel = channel === 'email' ? 'email' : 'mobile number';

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authApi.verifyCode({
        identifier,
        code: code.trim(),
      });
      completeLoginSession(response.data.token, response.data.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const response = await authApi.resendVerification({ identifier });
      if (response.data.devCode) {
        Alert.alert('Dev verification code', response.data.devCode);
      } else {
        Alert.alert('Code sent', `A new code was sent to your ${channelLabel}.`);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Verify Account"
        showBack
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Activate your account</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your {channelLabel}: {maskedDestination}
          </Text>

          {devCode ? (
            <Text style={styles.devHint}>Dev code: {devCode}</Text>
          ) : null}

          {error ? <ErrorMessage message={error} /> : null}

          <AppInput
            label="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
          />

          <AppButton title="Verify & Activate" onPress={handleVerify} loading={loading} />

          <AppButton
            title="Resend Code"
            variant="outline"
            onPress={handleResend}
            loading={resending}
            style={styles.resendButton}
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
  resendButton: {
    marginTop: theme.spacing.sm,
  },
});
