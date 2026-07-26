import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader, ChatInputBar, ErrorMessage, LoadingIndicator, MessageBubble } from '../../components';
import { theme } from '../../constants/theme';
import { chatApi } from '../../api/chatApi';
import { useAuthStore } from '../../store/authStore';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { getErrorMessage } from '../../utils/errors';
import { getChatSenderId } from '../../utils/chat';

export interface ChatThreadPanelProps {
  groupId: string;
  groupName: string;
  isTeamChat?: boolean;
  onBack: () => void;
}

export function ChatThreadPanel({ groupId, groupName, isTeamChat, onBack }: ChatThreadPanelProps) {
  const currentUserId = useAuthStore(state => state.user?._id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const activeRef = useRef(true);
  const {
    isRecording,
    recordDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    playVoice,
    cleanup,
  } = useVoiceRecorder();

  const handleBack = useCallback(() => {
    if (!activeRef.current) {
      return;
    }
    activeRef.current = false;
    setMessages([]);
    setDraft('');
    void cleanup();
    onBack();
  }, [cleanup, onBack]);

  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!activeRef.current) {
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError('');
      try {
        const response = await chatApi.listMessages(groupId, { page: 1, limit: 100 });
        if (activeRef.current) {
          setMessages(response.data.items);
        }
      } catch (err) {
        if (activeRef.current) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (activeRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [groupId],
  );

  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      void fetchMessages();

      const pollTimer = setInterval(() => {
        void fetchMessages(true);
      }, 4000);

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });

      return () => {
        activeRef.current = false;
        clearInterval(pollTimer);
        backSubscription.remove();
        void cleanup();
      };
    }, [cleanup, fetchMessages, handleBack]),
  );

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSendText = async () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    setSending(true);
    try {
      const response = await chatApi.sendText(groupId, content);
      setMessages(prev => [...prev, response.data.message]);
      setDraft('');
    } catch (err) {
      Alert.alert('Send failed', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const uploadAttachment = async (
    asset: { uri: string; type?: string; name?: string },
    messageType: 'image' | 'file' | 'voice',
    voiceDuration?: number,
  ) => {
    setSending(true);
    try {
      const response = await chatApi.sendAttachment(groupId, asset, {
        messageType,
        voiceDuration,
      });
      setMessages(prev => [...prev, response.data.message]);
    } catch (err) {
      Alert.alert('Upload failed', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response: ImagePickerResponse) => {
      const asset = response.assets?.[0];
      if (response.didCancel || !asset?.uri) {
        return;
      }
      void uploadAttachment(
        {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        },
        'image',
      );
    });
  };

  const handlePickAttachment = () => {
    launchImageLibrary({ mediaType: 'mixed', quality: 1 }, (response: ImagePickerResponse) => {
      const asset = response.assets?.[0];
      if (response.didCancel || !asset?.uri) {
        return;
      }
      const isImage = (asset.type || '').startsWith('image/');
      void uploadAttachment(
        {
          uri: asset.uri,
          type: asset.type || 'application/octet-stream',
          name: asset.fileName || 'attachment',
        },
        isImage ? 'image' : 'file',
      );
    });
  };

  const handleStartVoice = async () => {
    try {
      await startRecording();
    } catch (err) {
      Alert.alert('Voice message', getErrorMessage(err));
    }
  };

  const handleStopVoice = async () => {
    try {
      const recording = await stopRecording();
      await uploadAttachment(recording, 'voice', recording.duration);
    } catch (err) {
      Alert.alert('Voice message', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title={groupName}
        subtitle={isTeamChat ? 'Team Chat • Everyone' : 'Group Chat'}
        showBack
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {loading ? (
          <LoadingIndicator fullScreen />
        ) : error ? (
          <View style={styles.errorWrap}>
            <ErrorMessage message={error} onRetry={() => fetchMessages()} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}>
            {messages.map(item => (
              <MessageBubble
                key={item._id}
                message={item}
                isOwn={getChatSenderId(item.sender) === currentUserId}
                onPlayVoice={uri => {
                  void playVoice(uri);
                }}
              />
            ))}
          </ScrollView>
        )}

        <ChatInputBar
          value={draft}
          onChangeText={setDraft}
          onSend={handleSendText}
          onPickPhoto={handlePickPhoto}
          onPickAttachment={handlePickAttachment}
          onStartVoice={handleStartVoice}
          onStopVoice={handleStopVoice}
          onCancelVoice={cancelRecording}
          sending={sending}
          isRecording={isRecording}
          recordDuration={recordDuration}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  errorWrap: {
    flex: 1,
    padding: theme.spacing.md,
  },
  messagesList: {
    paddingVertical: theme.spacing.md,
    flexGrow: 1,
  },
});
