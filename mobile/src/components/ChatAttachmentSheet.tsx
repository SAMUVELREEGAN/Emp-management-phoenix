import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatTheme } from '../constants/chatTheme';
import { theme } from '../constants/theme';

interface ChatAttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onPickDocument: () => void;
}

export function ChatAttachmentSheet({
  visible,
  onClose,
  onPickGallery,
  onPickDocument,
}: ChatAttachmentSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>Share</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.option}
              onPress={() => {
                onClose();
                onPickGallery();
              }}>
              <View style={[styles.iconCircle, styles.galleryCircle]}>
                <MaterialCommunityIcons name="image-multiple" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>Gallery</Text>
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => {
                onClose();
                onPickDocument();
              }}>
              <View style={[styles.iconCircle, styles.documentCircle]}>
                <MaterialCommunityIcons name="file-pdf-box" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>Document</Text>
            </Pressable>
          </View>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: chatTheme.otherBubbleMeta,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl * 2,
    marginBottom: theme.spacing.lg,
  },
  option: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    minWidth: 88,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCircle: {
    backgroundColor: chatTheme.waSend,
  },
  documentCircle: {
    backgroundColor: '#E53935',
  },
  optionLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: chatTheme.otherBubbleText,
    fontWeight: theme.fonts.weights.medium,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  cancelText: {
    fontSize: theme.fonts.sizes.md,
    color: chatTheme.otherBubbleMeta,
    fontWeight: theme.fonts.weights.semibold,
  },
});
