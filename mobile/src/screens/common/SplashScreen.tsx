import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../constants/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="office-building" size={72} color={theme.colors.white} />
      <Text style={styles.title}>Employee Management</Text>
      <ActivityIndicator size="large" color={theme.colors.white} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.white,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
});
