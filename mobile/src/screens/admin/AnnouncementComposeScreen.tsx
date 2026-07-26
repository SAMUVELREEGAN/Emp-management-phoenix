import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.container}>
      <AppHeader
        title="Send Announcement"
        showBack
        onBack={handleBack}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}

        <Text style={styles.label}>Send to</Text>
        <View style={styles.audienceRow}>
          {AUDIENCE_OPTIONS.map(option => (
            <AppButton
              key={option.value}
              title={option.label}
              variant={audience === option.value ? 'primary' : 'outline'}
              onPress={() => setAudience(option.value)}
              style={styles.audienceBtn}
            />
          ))}
        </View>

        <AppInput label="Title" value={title} onChangeText={setTitle} placeholder="Announcement title" />
        <AppInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Write your announcement..."
          multiline
          numberOfLines={6}
        />

        <AppButton title="Send Announcement" onPress={handleSend} loading={submitting} />
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
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  audienceRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  audienceBtn: {
    flex: 1,
  },
});
