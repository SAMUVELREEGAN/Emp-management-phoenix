import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const illustrationSource = require('../assets/images/working-illustration.png');

export const ILLUSTRATION_WIDTH = 142;
export const ILLUSTRATION_HEIGHT = 148;

export function WorkingIllustration() {
  return (
    <View style={styles.frame}>
      <Image
        source={illustrationSource}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    backgroundColor: 'transparent',
  },
});
