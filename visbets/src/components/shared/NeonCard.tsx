/**
 * NeonCard Component
 * Card with gradient border and subtle glow effect
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/styles';

interface NeonCardProps {
  children: ReactNode;
  style?: ViewStyle;
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong';
}

export function NeonCard({ children, style, glowIntensity = 'none' }: NeonCardProps) {
  const shadowStyle = getShadowStyle(glowIntensity);

  return (
    <View style={[styles.container, shadowStyle, style]}>
      <LinearGradient
        colors={[colors.border.light, colors.border.default, colors.border.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

function getShadowStyle(intensity: NeonCardProps['glowIntensity']) {
  switch (intensity) {
    case 'subtle':
      return styles.glowSubtle;
    case 'medium':
      return styles.glowMedium;
    case 'strong':
      return styles.glowStrong;
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    padding: 1, // Border width
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg - 1,
    padding: spacing.lg,
  },
  glowSubtle: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  glowMedium: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  glowStrong: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
});
