/**
 * BackButton - Styled navigation back button
 *
 * A polished back button with haptic feedback and smooth animation.
 * Designed to be visible and accessible on dark backgrounds.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';

interface BackButtonProps {
  label?: string;
  onPress?: () => void;
  variant?: 'default' | 'pill' | 'icon-only';
  color?: string;
}

export function BackButton({
  label = 'Back',
  onPress,
  variant = 'pill',
  color = colors.text.primary,
}: BackButtonProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [onPress, router]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (variant === 'icon-only') {
    return (
      <Animated.View style={[styles.iconOnlyContainer, animatedStyle]}>
        <Pressable
          style={styles.iconOnlyButton}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Ionicons name="chevron-back" size={24} color={color} />
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'pill') {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          style={styles.pillButton}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.pillIconContainer}>
            <Ionicons name="chevron-back" size={20} color={colors.primary.main} />
          </View>
          <Text style={styles.pillLabel}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.defaultButton}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons name="chevron-back" size={24} color={color} />
        <Text style={[styles.defaultLabel, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Icon only variant
  iconOnlyContainer: {
    alignSelf: 'flex-start',
  },
  iconOnlyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Pill variant (recommended) - Sleek and visually bold
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary.main + '40',
    gap: spacing.sm,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pillIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },

  // Default variant
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  defaultLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});
