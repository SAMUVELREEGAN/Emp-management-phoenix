import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const illustrationSource = require('../assets/images/live-tracking-illustration.png');

export const LIVE_TRACKING_ILLUSTRATION_WIDTH = 120;
export const LIVE_TRACKING_ILLUSTRATION_HEIGHT = 120;

export function LiveTrackingIllustration() {
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
    width: LIVE_TRACKING_ILLUSTRATION_WIDTH,
    height: LIVE_TRACKING_ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: LIVE_TRACKING_ILLUSTRATION_WIDTH,
    height: LIVE_TRACKING_ILLUSTRATION_HEIGHT,
    backgroundColor: 'transparent',
  },
});
