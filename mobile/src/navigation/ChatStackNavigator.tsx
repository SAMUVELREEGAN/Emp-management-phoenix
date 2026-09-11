import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChatStackParamList } from './types';
import ChatHubScreen from '../screens/common/ChatHubScreen';
import CreateChatGroupScreen from '../screens/admin/CreateChatGroupScreen';

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: false,
};

export function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={stackScreenOptions}>
      <ChatStack.Screen name="ChatHub" component={ChatHubScreen} />
      <ChatStack.Screen name="CreateChatGroup" component={CreateChatGroupScreen} />
    </ChatStack.Navigator>
  );
}
