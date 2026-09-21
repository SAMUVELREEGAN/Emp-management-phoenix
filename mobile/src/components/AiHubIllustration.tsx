import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
} from 'react-native-svg';
import { theme } from '../constants/theme';

export type AiHubIllustrationVariant = 'analytics' | 'assistant';

interface AiHubIllustrationProps {
  variant: AiHubIllustrationVariant;
  size?: number;
}

const GOLD = theme.colors.primary;
const GOLD_MID = '#F5D547';
const INK = theme.colors.accent;

function AnalyticsCenter() {
  return (
    <G>
      <Rect x="38" y="52" width="6" height="14" rx="2" fill={INK} opacity={0.85} />
      <Rect x="47" y="46" width="6" height="20" rx="2" fill={INK} />
      <Rect x="56" y="40" width="6" height="26" rx="2" fill={GOLD} />
      <Path
        d="M36 58 Q50 44 64 38"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />
    </G>
  );
}

function AssistantCenter() {
  return (
    <G>
      <Rect x="34" y="42" width="32" height="22" rx="10" fill={INK} />
      <Path d="M44 64 L50 70 L56 64" fill={INK} />
      <Circle cx="44" cy="52" r="2.2" fill={GOLD} />
      <Circle cx="50" cy="52" r="2.2" fill={GOLD} />
      <Circle cx="56" cy="52" r="2.2" fill={GOLD} />
    </G>
  );
}

export function AiHubIllustration({ variant, size = 88 }: AiHubIllustrationProps) {
  const gradId = `aiOrb_${variant}`;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="40%" r="55%">
            <Stop offset="0" stopColor="#FFF9D6" />
            <Stop offset="0.45" stopColor={GOLD_MID} />
            <Stop offset="1" stopColor={GOLD} />
          </RadialGradient>
          <SvgLinearGradient id={`${gradId}_ring`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={INK} stopOpacity="0.08" />
            <Stop offset="1" stopColor={INK} stopOpacity="0.22" />
          </SvgLinearGradient>
        </Defs>

        <Circle cx="50" cy="50" r="46" fill={`url(#${gradId})`} />
        <Circle cx="50" cy="50" r="46" fill="none" stroke={INK} strokeWidth="0.6" opacity={0.12} />

        <Ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="14"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          opacity={0.18}
          transform="rotate(-24 50 50)"
        />
        <Ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="14"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          opacity={0.18}
          transform="rotate(24 50 50)"
        />
        <Ellipse
          cx="50"
          cy="50"
          rx="14"
          ry="38"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          opacity={0.14}
        />

        <Circle cx="50" cy="50" r="22" fill={theme.colors.white} opacity={0.92} />
        <Circle cx="50" cy="50" r="22" fill="none" stroke={INK} strokeWidth="1" opacity={0.1} />

        <Circle cx="22" cy="34" r="3" fill={GOLD} />
        <Circle cx="78" cy="38" r="2.5" fill={INK} opacity={0.35} />
        <Circle cx="72" cy="68" r="2.8" fill={GOLD} opacity={0.9} />
        <Circle cx="28" cy="72" r="2" fill={INK} opacity={0.25} />

        {variant === 'analytics' ? <AnalyticsCenter /> : <AssistantCenter />}

        <Path
          d="M50 14 L51.8 19.2 L57 19.2 L52.9 22.4 L54.7 27.6 L50 24.4 L45.3 27.6 L47.1 22.4 L43 19.2 L48.2 19.2 Z"
          fill={INK}
          opacity={0.75}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
