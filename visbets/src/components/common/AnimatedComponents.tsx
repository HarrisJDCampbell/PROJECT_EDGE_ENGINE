/**
 * AnimatedComponents - Reusable animation components for smooth UI
 *
 * Provides consistent, polished animations across the entire app:
 * - FadeInView: Fade in with optional slide
 * - StaggeredList: Staggered animation for lists
 * - ScalePress: Scale on press for touchables
 * - AnimatedCard: Card with entry animation
 */

import React, { useEffect, useCallback, memo } from 'react';
import { View, Pressable, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeInLeft,
  SlideInDown,
  SlideInRight,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ============================================================================
// FADE IN VIEW
// ============================================================================

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView = memo(function FadeInView({
  children,
  delay = 0,
  duration = 400,
  direction = 'up',
  distance = 20,
  style,
}: FadeInViewProps) {
  const getEnteringAnimation = () => {
    switch (direction) {
      case 'up':
        return FadeInUp.duration(duration).delay(delay).springify().damping(15);
      case 'down':
        return FadeInDown.duration(duration).delay(delay).springify().damping(15);
      case 'left':
        return FadeInLeft.duration(duration).delay(delay).springify().damping(15);
      case 'right':
        return FadeInRight.duration(duration).delay(delay).springify().damping(15);
      case 'none':
      default:
        return FadeIn.duration(duration).delay(delay);
    }
  };

  return (
    <Animated.View entering={getEnteringAnimation()} style={style}>
      {children}
    </Animated.View>
  );
});

// ============================================================================
// SCALE PRESS
// ============================================================================

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scale?: number;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ScalePress = memo(function ScalePress({
  children,
  onPress,
  onLongPress,
  scale = 0.97,
  haptic = true,
  hapticStyle = 'light',
  disabled = false,
  style,
}: ScalePressProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const triggerHaptic = useCallback(() => {
    if (haptic && Platform.OS !== 'web') {
      const feedbackStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticStyle];
      Haptics.impactAsync(feedbackStyle);
    }
  }, [haptic, hapticStyle]);

  const handlePressIn = () => {
    scaleValue.value = withSpring(scale, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    triggerHaptic();
    onPress?.();
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});

// ============================================================================
// ANIMATED CARD
// ============================================================================

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  baseDelay?: number;
  staggerDelay?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedCard = memo(function AnimatedCard({
  children,
  index = 0,
  baseDelay = 0,
  staggerDelay = 50,
  onPress,
  style,
}: AnimatedCardProps) {
  const delay = baseDelay + index * staggerDelay;

  if (onPress) {
    return (
      <Animated.View
        entering={FadeInUp.duration(400).delay(delay).springify().damping(15)}
        style={style}
      >
        <ScalePress onPress={onPress}>
          {children}
        </ScalePress>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay).springify().damping(15)}
      style={style}
    >
      {children}
    </Animated.View>
  );
});

// ============================================================================
// STAGGERED LIST ITEM
// ============================================================================

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  baseDelay?: number;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggeredItem = memo(function StaggeredItem({
  children,
  index,
  baseDelay = 100,
  staggerDelay = 50,
  style,
}: StaggeredItemProps) {
  // Cap the delay at 10 items to prevent too long waits for long lists
  const cappedIndex = Math.min(index, 10);
  const delay = baseDelay + cappedIndex * staggerDelay;

  return (
    <Animated.View
      entering={FadeInUp.duration(350).delay(delay).springify().damping(15)}
      style={style}
    >
      {children}
    </Animated.View>
  );
});

// ============================================================================
// SHIMMER PULSE
// ============================================================================

interface ShimmerPulseProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShimmerPulse = memo(function ShimmerPulse({
  width,
  height,
  borderRadius = 8,
  style,
}: ShimmerPulseProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(0.6, { duration: 800 }, () => {
      opacity.value = withTiming(0.3, { duration: 800 });
    });

    // Create pulsing loop
    const interval = setInterval(() => {
      opacity.value = withTiming(0.6, { duration: 800 }, () => {
        opacity.value = withTiming(0.3, { duration: 800 });
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#2a2a2e',
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

// ============================================================================
// PAGE TRANSITION
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PageTransition = memo(function PageTransition({
  children,
  style,
}: PageTransitionProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
});

// ============================================================================
// SLIDE UP MODAL
// ============================================================================

interface SlideUpProps {
  children: React.ReactNode;
  visible: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SlideUp = memo(function SlideUp({
  children,
  visible,
  style,
}: SlideUpProps) {
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(300, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export const Animations = {
  FadeInView,
  ScalePress,
  AnimatedCard,
  StaggeredItem,
  ShimmerPulse,
  PageTransition,
  SlideUp,
};
