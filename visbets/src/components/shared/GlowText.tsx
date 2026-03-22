/**
 * GlowText Component
 * Text with neon glow effect for key numbers and values
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface GlowTextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'stat';
  color?: string;
  glowColor?: string;
  style?: TextStyle;
}

export function GlowText({
  children,
  size = 'md',
  color = colors.primary.main,
  glowColor = colors.primary.main,
  style,
}: GlowTextProps) {
  const sizeStyle = getSizeStyle(size);

  return (
    <Text
      style={[
        styles.text,
        sizeStyle,
        { color },
        {
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: size === 'stat' ? 12 : size === 'xl' ? 10 : 8,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function getSizeStyle(size: GlowTextProps['size']) {
  switch (size) {
    case 'sm':
      return styles.sm;
    case 'md':
      return styles.md;
    case 'lg':
      return styles.lg;
    case 'xl':
      return styles.xl;
    case 'stat':
      return styles.stat;
    default:
      return styles.md;
  }
}

const styles = StyleSheet.create({
  text: {
    fontWeight: typography.fontWeight.bold,
  },
  sm: {
    fontSize: typography.fontSize.base,
  },
  md: {
    fontSize: typography.fontSize.xl,
  },
  lg: {
    fontSize: typography.fontSize['2xl'],
  },
  xl: {
    fontSize: typography.fontSize['3xl'],
  },
  stat: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: -1,
  },
});
