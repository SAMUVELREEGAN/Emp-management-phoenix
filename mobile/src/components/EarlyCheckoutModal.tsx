import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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

  if (!visible) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(remark.trim());
  };

  const handleCancel = () => {
    setRemark('');
    onCancel();
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={loading ? undefined : handleCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>Early Check-Out</Text>
          <Text style={styles.message}>
            You are checking out before office hours end ({officeEndTime}). Please provide a
            reason. This remark will be visible to admin and HR.
          </Text>
          <AppInput
            label="Reason for early check-out"
            value={remark}
            onChangeText={setRemark}
            multiline
            numberOfLines={4}
            placeholder="Explain why you are leaving early..."
            style={styles.input}
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
              disabled={!remark.trim()}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
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
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});
