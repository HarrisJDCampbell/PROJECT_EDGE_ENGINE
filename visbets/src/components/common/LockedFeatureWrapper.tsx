/**
 * LockedFeatureWrapper Component
 * Wraps content with a blur overlay and glowing border for locked features.
 * Uses VisPlus (starter) and VISMAX (pro) tier branding.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';

// VisPlus (starter) — neon green accent
const VISPLUS_COLOR = colors.primary.main; // #00FF88
// VISMAX (pro) — gold accent
const VISMAX_COLOR = '#FFD700';

interface LockedFeatureWrapperProps {
  /** The tier required to access this feature */
  requiredTier: 'starter' | 'pro';
  /** Whether the feature is locked */
  isLocked: boolean;
  /** Children to render (the actual feature component) */
  children: React.ReactNode;
  /** Feature name for the lock badge */
  featureName?: string;
}

export function LockedFeatureWrapper({
  requiredTier,
  isLocked,
  children,
  featureName,
}: LockedFeatureWrapperProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulsing animation for VISMAX gold border
  useEffect(() => {
    if (isLocked && requiredTier === 'pro') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLocked, requiredTier, pulseAnim]);

  if (!isLocked) {
    return <>{children}</>;
  }

  const tierColor = requiredTier === 'pro' ? VISMAX_COLOR : VISPLUS_COLOR;
  const tierName = requiredTier === 'pro' ? 'VISMAX' : 'VisPlus';

  // Animated border width for VISMAX throbbing effect
  const animatedBorderWidth = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2.5],
  });

  // Animated shadow opacity for glow effect
  const animatedShadowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Animated shadow radius for glow pulse
  const animatedShadowRadius = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 14],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: tierColor + '60',
          borderWidth: requiredTier === 'pro' ? animatedBorderWidth : 1.5,
          shadowColor: tierColor,
          shadowOpacity: requiredTier === 'pro' ? animatedShadowOpacity : 0.3,
          shadowRadius: requiredTier === 'pro' ? animatedShadowRadius : 8,
        },
      ]}
    >
      {/* Actual content behind blur */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* Blur overlay */}
      <BlurView intensity={18} tint="dark" style={styles.blurOverlay}>
        <LinearGradient
          colors={['rgba(10, 10, 11, 0.55)', 'rgba(10, 10, 11, 0.75)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Lock badge */}
        <TouchableOpacity
          style={[styles.lockBadge, { borderColor: tierColor + '80' }]}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[tierColor + '25', tierColor + '08']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="lock-closed" size={16} color={tierColor} />
          <Text style={[styles.lockText, { color: tierColor }]}>
            {tierName}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={tierColor} />
        </TouchableOpacity>

        <Text style={styles.featureLabel}>
          Unlock {featureName || (requiredTier === 'pro' ? 'premium analytics' : 'advanced stats')}
        </Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  contentContainer: {
    // Content renders normally behind blur
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lockText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  featureLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  cornerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
