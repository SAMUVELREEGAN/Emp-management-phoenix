import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { AppButton } from './AppButton';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  /** Use an in-tree overlay instead of native Modal (safer during navigator teardown). */
  inline?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  inline = false,
  onConfirm,
  onCancel,
  }: ConfirmationModalProps) {
  // Avoid mounting overlay host views when hidden — Fabric can crash if a
  // visible dialog is torn down during navigator switches.
  if (!visible) {
    return null;
  }

  const content = (
    <Pressable style={styles.overlay} onPress={loading ? undefined : onCancel}>
      <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <AppButton
            title={cancelLabel}
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            style={styles.button}
          />
          <AppButton
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
            style={styles.button}
          />
        </View>
      </Pressable>
    </Pressable>
  );

  if (inline) {
    return <View style={styles.inlineHost}>{content}</View>;
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  inlineHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
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
    marginBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});
