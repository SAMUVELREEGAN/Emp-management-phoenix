import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader } from '../../components';
import { theme } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppHeader title="Forgot Password" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Password Reset</Text>
        <Text style={styles.message}>
          Password reset is not available in the mobile app yet. Please contact your administrator
          to reset your password.
        </Text>
        <AppButton title="Back to Login" onPress={() => navigation.goBack()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
});
