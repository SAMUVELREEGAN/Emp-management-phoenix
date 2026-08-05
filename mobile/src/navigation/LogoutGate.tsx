import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

interface LogoutGateProps {
  children: React.ReactNode;
}

/** Replaces tab UI with an empty shell during logout so Fabric can tear down native views safely. */
export function LogoutGate({ children }: LogoutGateProps) {
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);

  if (isLoggingOut) {
    return <View style={styles.shell} collapsable={false} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
});
