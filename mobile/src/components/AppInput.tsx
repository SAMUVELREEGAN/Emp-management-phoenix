import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Show eye icon to toggle password visibility (defaults to on when secureTextEntry is set). */
  showPasswordToggle?: boolean;
}

export function AppInput({
  label,
  error,
  style,
  secureTextEntry,
  showPasswordToggle,
  ...props
}: AppInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasPasswordToggle = !!secureTextEntry && showPasswordToggle !== false;
  const isSecure = hasPasswordToggle ? !passwordVisible : secureTextEntry;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            hasPasswordToggle ? styles.inputWithToggle : null,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isSecure}
          {...props}
        />
        {hasPasswordToggle ? (
          <Pressable
            style={styles.toggleButton}
            onPress={() => setPasswordVisible(current => !current)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
            <MaterialCommunityIcons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  toggleButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.error,
  },
});
