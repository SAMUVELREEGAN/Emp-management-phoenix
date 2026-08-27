import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppInput, ErrorMessage } from '../../components';
import { colors, spacing, radii, fonts } from '../../constants/theme';
import { authApi } from '../../api/authApi';
import { completeLoginSession } from '../../navigation/authSession';
import { getErrorMessage } from '../../utils/errors';
import {
  getIdentifierKeyboardType,
  validateLoginIdentifier,
  validatePassword,
} from '../../validations';
import type { AuthStackParamList } from '../../navigation/types';

const loginBackground = require('../../assets/images/login-background.png');

const LOGIN_BG_WIDTH = 1024;
const LOGIN_BG_HEIGHT = 1536;
/** Vertical center of the main team group in the source image (0 = top, 1 = bottom). */
const TEAM_FOCUS_Y_RATIO = 0.66;
/** Where that team group should sit on screen (above the login sheet). */
const TEAM_SCREEN_Y_RATIO = 0.22;

function getLoginBackgroundLayout(windowWidth: number, windowHeight: number) {
  const coverScale = Math.max(
    windowWidth / LOGIN_BG_WIDTH,
    windowHeight / LOGIN_BG_HEIGHT,
  );
  const width = LOGIN_BG_WIDTH * coverScale;
  const height = LOGIN_BG_HEIGHT * coverScale;
  const left = (windowWidth - width) / 2;
  const top = windowHeight * TEAM_SCREEN_Y_RATIO - height * TEAM_FOCUS_Y_RATIO;

  return { width, height, left, top };
}

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const backgroundLayout = useMemo(
    () => getLoginBackgroundLayout(windowWidth, windowHeight),
    [windowWidth, windowHeight],
  );
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
          Alert.alert('Dev verification code', data.devCode);
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
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <Image
        source={loginBackground}
        style={[styles.backgroundImage, backgroundLayout]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.overlay} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.hero,
            { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.md },
          ]}
        >
          <Text style={styles.heroTitle}>Let&apos;s get you in!</Text>
          <Text style={styles.heroSubtitle}>
            Hi! Welcome back, you&apos;ve been missed
          </Text>
        </View>

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
          ]}
        >
          <View style={styles.sheetHandle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            bounces={false}
          >
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
                  placeholder="you@company.com"
                  keyboardType={getIdentifierKeyboardType(value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={fieldError?.message}
                  leadingIcon={
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={22}
                      color={colors.textMuted}
                    />
                  }
                  labelStyle={styles.inputLabel}
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
                  placeholder="Enter your password"
                  secureTextEntry
                  error={fieldError?.message}
                  leadingIcon={
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={22}
                      color={colors.textMuted}
                    />
                  }
                  labelStyle={styles.inputLabel}
                />
              )}
            />

            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>

            <AppButton
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.signInButton}
            />

            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>Need help signing in?</Text>
              <Text style={styles.helpText}>
                Use Forgot password to receive a reset code by email, or contact your HR or
                admin team if you need account access.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f2a30',
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 42, 48, 0.48)',
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    maxHeight: '62%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetContent: {
    paddingBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  forgot: {
    textAlign: 'right',
    color: colors.primaryDark,
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.md,
    fontWeight: fonts.weights.medium,
  },
  signInButton: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 52,
  },
  helpCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
