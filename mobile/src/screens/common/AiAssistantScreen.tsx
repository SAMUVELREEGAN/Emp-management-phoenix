import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader } from '../../components';
import { theme } from '../../constants/theme';
import { assistantApi } from '../../api/assistantApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import type { AssistantQuestion } from '../../types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  isError?: boolean;
}

function renderAnswerText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
}

export default function AiAssistantScreen() {
  const user = useAuthStore(state => state.user);
  const [questions, setQuestions] = useState<AssistantQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [askingId, setAskingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: true });

  const isHrMode = user?.role === 'hr' || user?.role === 'admin';
  const title = isHrMode ? 'AI HR Analytics' : 'AI Employee Assistant';
  const subtitle = isHrMode
    ? 'Workforce insights from your live data'
    : 'Ask about your leaves, attendance, and tasks';

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setError('');
    try {
      const response = await assistantApi.getQuestions();
      setQuestions(response.data.questions);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const handleAsk = async (question: AssistantQuestion) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question.label,
    };

    setMessages(current => [...current, userMessage]);
    setAskingId(question.id);
    setError('');

    try {
      const response = await assistantApi.ask(question.id);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.data.answer,
      };
      setMessages(current => [...current, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: getErrorMessage(err),
        isError: true,
      };
      setMessages(current => [...current, errorMessage]);
    } finally {
      setAskingId(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <View style={styles.container}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <MaterialCommunityIcons
              name={isHrMode ? 'chart-timeline-variant' : 'robot-outline'}
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.welcomeTitle}>
            Hi {firstName}! {isHrMode ? 'What would you like to analyze?' : 'How can I help you today?'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isHrMode
              ? 'Tap a question below to get real-time HR analytics from your organization data.'
              : 'Tap a question below to get answers from your personal records.'}
          </Text>
        </View>

        {loadingQuestions ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          </View>
        ) : error && !questions.length ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchQuestions} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Suggested questions</Text>
            {questions.map(question => (
              <Pressable
                key={question.id}
                style={[styles.chip, askingId === question.id && styles.chipDisabled]}
                onPress={() => handleAsk(question)}
                disabled={askingId !== null}>
                <MaterialCommunityIcons
                  name={isHrMode ? 'chart-line' : 'comment-question-outline'}
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.chipText}>{question.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
            ]}>
            {message.role === 'assistant' ? (
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="robot" size={18} color={theme.colors.primary} />
              </View>
            ) : null}
            <View
              style={[
                styles.bubble,
                message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                message.isError && styles.bubbleError,
              ]}>
              <Text
                style={[
                  styles.bubbleText,
                  message.role === 'user' && styles.bubbleTextUser,
                  message.isError && styles.bubbleTextError,
                ]}>
                {message.role === 'assistant' && !message.isError
                  ? renderAnswerText(message.text)
                  : message.text}
              </Text>
            </View>
          </View>
        ))}

        {askingId ? (
          <View style={styles.typingRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="robot" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.typingText}>Analyzing your data...</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  welcomeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  welcomeTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  errorBox: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: theme.fonts.sizes.sm,
  },
  retryBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  retryText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  suggestions: {
    gap: theme.spacing.sm,
  },
  suggestionsTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.card,
  },
  chipDisabled: {
    opacity: 0.6,
  },
  chipText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.medium,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 4,
    ...theme.shadows.card,
  },
  bubbleError: {
    backgroundColor: theme.colors.errorLight,
  },
  bubbleText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: theme.colors.accent,
    fontWeight: theme.fonts.weights.medium,
  },
  bubbleTextError: {
    color: theme.colors.error,
  },
  bold: {
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.card,
  },
  typingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
