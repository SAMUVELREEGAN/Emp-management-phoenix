import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
} from '../../components';
import { theme } from '../../constants/theme';
import { announcementApi } from '../../api/announcementApi';
import { getErrorMessage } from '../../utils/errors';
import type { AnnouncementAudience } from '../../types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

const AUDIENCE_OPTIONS: Array<{ value: AnnouncementAudience; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'employees', label: 'Employees' },
  { value: 'hr', label: 'HR' },
];

function AudienceSegment({
  value,
  onChange,
}: {
  value: AnnouncementAudience;
  onChange: (value: AnnouncementAudience) => void;
}) {
  return (
    <View style={styles.audienceShell}>
      {AUDIENCE_OPTIONS.map(option => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.audienceTab, active && styles.audienceTabActive]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.audienceTabText, active && styles.audienceTabTextActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AnnouncementComposeScreen() {
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'NotificationsMain' }],
    index: 0,
  });

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Enter a title and message.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await announcementApi.send({
        title: title.trim(),
        message: message.trim(),
        audience,
      });
      const count = response.data.recipientCount;
      const audienceLabel =
        AUDIENCE_OPTIONS.find(option => option.value === audience)?.label ?? audience;

      Alert.alert(
        'Announcement sent',
        count > 0
          ? `Delivered to ${count} ${audienceLabel.toLowerCase()} recipient${count === 1 ? '' : 's'}.`
          : `No ${audienceLabel.toLowerCase()} recipients were found.`,
        [{ text: 'OK', onPress: () => handleBack() }],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title="Send Announcement" showBack onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorWrap}>
              <ErrorMessage message={error} />
            </View>
          ) : null}

          <Text style={styles.label}>Send to</Text>
          <AudienceSegment value={audience} onChange={setAudience} />

          <AppInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Announcement title"
            labelStyle={styles.fieldLabel}
          />
          <AppInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Write your announcement..."
            multiline
            numberOfLines={6}
            labelStyle={styles.fieldLabel}
            style={styles.messageInput}
          />

          <AppButton title="Send Announcement" onPress={handleSend} loading={submitting} style={styles.sendBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.card,
  },
  errorWrap: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
  },
  audienceShell: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    backgroundColor: '#EEF0F3',
    borderRadius: theme.radii.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  audienceTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  audienceTabActive: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.card,
  },
  audienceTabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.semibold,
  },
  audienceTabTextActive: {
    color: theme.colors.accent,
  },
  messageInput: {
    minHeight: 148,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  sendBtn: {
    marginTop: theme.spacing.md,
  },
});
