import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';

/** Empty shell shown while authenticated navigators tear down during logout. */
export function LogoutShell() {
  return <View style={styles.shell} collapsable={false} />;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
});
