import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { theme } from '../constants/theme';

interface EarlyCheckoutModalProps {
  visible: boolean;
  officeEndTime: string;
  loading?: boolean;
  onConfirm: (remark: string) => void;
  onCancel: () => void;
}

export function EarlyCheckoutModal({
  visible,
  officeEndTime,
  loading = false,
  onConfirm,
  onCancel,
}: EarlyCheckoutModalProps) {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setRemark('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmed = remark.trim();
    if (!trimmed) {
      setError('Please enter a reason before checking out.');
      return;
    }

    setError('');
    onConfirm(trimmed);
  };

  const handleCancel = () => {
    setRemark('');
    setError('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={loading ? undefined : handleCancel}>
          <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text style={styles.title}>Early Check-Out</Text>
              <Text style={styles.message}>
                You are checking out before office hours end ({officeEndTime}). Please provide a
                reason below. This remark will be visible to admin and HR.
              </Text>
              <AppInput
                label="Reason for early check-out"
                value={remark}
                onChangeText={value => {
                  setRemark(value);
                  if (error) {
                    setError('');
                  }
                }}
                multiline
                numberOfLines={4}
                placeholder="Explain why you are leaving early..."
                style={styles.input}
                error={error}
                editable={!loading}
              />
              <View style={styles.actions}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancel}
                  disabled={loading}
                  style={styles.button}
                />
                <AppButton
                  title="Check Out"
                  onPress={handleConfirm}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  input: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});
