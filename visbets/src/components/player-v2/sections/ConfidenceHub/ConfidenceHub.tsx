/**
 * ConfidenceHub - Consolidated confidence section
 *
 * Combines the radial gauge, metrics grid, and streak indicator
 * into a single cohesive section with long-press detail support.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RadialGauge } from './RadialGauge';
import { MetricsGrid } from './MetricsGrid';
import { colors } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { ConfidenceHubProps } from '../../types';

export function ConfidenceHub({ data, statType, onLongPress }: ConfidenceHubProps) {
  const handleLongPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onLongPress?.();
  }, [onLongPress]);

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.container}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={styles.pressable}
      >
        {/* Radial gauge with projection metrics */}
        <RadialGauge
          confidence={data.confidence}
          projection={data.projection}
          line={data.line}
          edge={data.edge}
          streak={data.streak}
        />

        {/* Rolling averages and risk indicators */}
        <MetricsGrid
          rollingAverages={data.rollingAverages}
          line={data.line}
          volatility={data.volatility}
          minutesRisk={data.minutesRisk}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  pressable: {
    paddingVertical: spacing.lg,
  },
});
