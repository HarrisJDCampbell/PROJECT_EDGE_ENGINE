/**
 * Login Screen
 * Minimal, borderless design with full-screen neon border animation
 * Custom animated border streak that loops infinitely
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/styles';
import { signInWithGoogle } from '../../src/services/auth/authService';
import { useAuthStore } from '../../src/stores/authStore';
import { analyticsService } from '../../src/services/analytics/analyticsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Border streak configuration
const STREAK_LENGTH = 120;
const STREAK_WIDTH = 4;
const BORDER_OFFSET = 2; // Offset from screen edge
const ANIMATION_DURATION = 4000; // Full loop duration in ms

// Calculate perimeter segments
const TOP_LENGTH = SCREEN_WIDTH - 2 * BORDER_OFFSET;
const RIGHT_LENGTH = SCREEN_HEIGHT - 2 * BORDER_OFFSET;
const BOTTOM_LENGTH = SCREEN_WIDTH - 2 * BORDER_OFFSET;
const LEFT_LENGTH = SCREEN_HEIGHT - 2 * BORDER_OFFSET;
const PERIMETER = TOP_LENGTH + RIGHT_LENGTH + BOTTOM_LENGTH + LEFT_LENGTH;

/**
 * NeonBorderStreak - Animated glowing streak that travels around screen border
 */
function NeonBorderStreak({ delay = 0, reverse = false }: { delay?: number; reverse?: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.linear,
        }),
        -1, // Infinite repeats
        false // Don't reverse
      );
    }, delay);

    return () => {
      clearTimeout(timer);
      progress.value = 0;
    };
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = progress.value * PERIMETER;

    let x = BORDER_OFFSET;
    let y = BORDER_OFFSET;
    let rotation = 0;

    if (!reverse) {
      // Clockwise: Top(right) → Right(down) → Bottom(left) → Left(up)
      if (distance <= TOP_LENGTH) {
        x = BORDER_OFFSET + distance;
        y = BORDER_OFFSET;
        rotation = 0;
      } else if (distance <= TOP_LENGTH + RIGHT_LENGTH) {
        const edgeProgress = distance - TOP_LENGTH;
        x = SCREEN_WIDTH - BORDER_OFFSET;
        y = BORDER_OFFSET + edgeProgress;
        rotation = 90;
      } else if (distance <= TOP_LENGTH + RIGHT_LENGTH + BOTTOM_LENGTH) {
        const edgeProgress = distance - TOP_LENGTH - RIGHT_LENGTH;
        x = SCREEN_WIDTH - BORDER_OFFSET - edgeProgress;
        y = SCREEN_HEIGHT - BORDER_OFFSET;
        rotation = 180;
      } else {
        const edgeProgress = distance - TOP_LENGTH - RIGHT_LENGTH - BOTTOM_LENGTH;
        x = BORDER_OFFSET;
        y = SCREEN_HEIGHT - BORDER_OFFSET - edgeProgress;
        rotation = 270;
      }
    } else {
      // Counter-clockwise: Top(left) → Left(down) → Bottom(right) → Right(up)
      // Starts at top-right, opposing the clockwise streak
      if (distance <= TOP_LENGTH) {
        x = SCREEN_WIDTH - BORDER_OFFSET - distance;
        y = BORDER_OFFSET;
        rotation = 180;
      } else if (distance <= TOP_LENGTH + LEFT_LENGTH) {
        const edgeProgress = distance - TOP_LENGTH;
        x = BORDER_OFFSET;
        y = BORDER_OFFSET + edgeProgress;
        rotation = 270;
      } else if (distance <= TOP_LENGTH + LEFT_LENGTH + BOTTOM_LENGTH) {
        const edgeProgress = distance - TOP_LENGTH - LEFT_LENGTH;
        x = BORDER_OFFSET + edgeProgress;
        y = SCREEN_HEIGHT - BORDER_OFFSET;
        rotation = 0;
      } else {
        const edgeProgress = distance - TOP_LENGTH - LEFT_LENGTH - BOTTOM_LENGTH;
        x = SCREEN_WIDTH - BORDER_OFFSET;
        y = SCREEN_HEIGHT - BORDER_OFFSET - edgeProgress;
        rotation = 90;
      }
    }

    const opacity = interpolate(
      progress.value,
      [0, 0.02, 0.98, 1],
      [0.3, 1, 1, 0.3]
    );

    return {
      transform: [
        { translateX: x - STREAK_LENGTH / 2 },
        { translateY: y - STREAK_WIDTH / 2 },
        { rotate: `${rotation}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.streak, animatedStyle]}>
      <View style={styles.streakGlow} />
      <View style={styles.streakCore} />
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleGoogleSignIn = async () => {
    setLoading(true);
    analyticsService.track('Sign In Started', { provider: 'google' });
    try {
      const { user, session, error } = await signInWithGoogle();
      if (error) {
        if (error.message === 'Sign in cancelled') {
          // User tapped back — not an error worth alerting
        } else {
          analyticsService.track('Sign In Failed', { error: error.message });
          Alert.alert('Sign In Error', error.message);
        }
      } else if (user && session) {
        analyticsService.track('Sign In Completed', { provider: 'google' });
        // The Supabase auth listener (setupAuthListener in _layout.tsx) will
        // fire automatically, fetch the profile, and set user+session together.
        // Do NOT set session here without user — it triggers the auth guard
        // with user=null, which incorrectly routes to onboarding for returning
        // users before the listener has fetched their profile.
      }
    } catch (err: any) {
      analyticsService.track('Sign In Failed', { error: err?.message });
      Alert.alert('Sign In Error', err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = () => {
    router.push('/(auth)/phone-verify');
  };

  const handleEmailSignIn = () => {
    router.push('/(auth)/email-verify');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Neon Border Streaks - Two opposing for continuous effect */}
      <NeonBorderStreak delay={0} />
      <NeonBorderStreak delay={0} reverse />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo - Upper Third */}
        <Animated.View
          entering={FadeIn.duration(800).delay(200)}
          style={styles.logoContainer}
        >
          <Image
            source={require('../../assets/animations/visbets-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Sign In Buttons - Horizontal */}
        <View style={styles.buttonContainer}>
          {/* Google Sign In */}
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <Ionicons name="logo-google" size={28} color={colors.background.primary} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Email Sign In */}
          <Animated.View entering={FadeInUp.duration(600).delay(500)}>
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={handleEmailSignIn}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={28} color={colors.primary.main} />
            </TouchableOpacity>
          </Animated.View>

          {/* Phone Sign In */}
          <Animated.View entering={FadeInUp.duration(600).delay(600)}>
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={handlePhoneSignIn}
              activeOpacity={0.7}
            >
              <Ionicons name="phone-portrait-outline" size={28} color={colors.primary.main} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Subtle hint text */}
        <Animated.View
          entering={FadeIn.duration(800).delay(700)}
          style={styles.hintContainer}
        >
          <Text style={styles.hintText}>sign in to continue</Text>
        </Animated.View>

        {/* Legal Links — Required by Apple Guideline 5.1.1 */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>By signing in you agree to our{' '}</Text>
          <TouchableOpacity
            onPress={() => router.push('/terms-of-service')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>{' '}and{' '}</Text>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // Neon streak styles
  streak: {
    position: 'absolute',
    width: STREAK_LENGTH,
    height: STREAK_WIDTH,
    zIndex: 10,
  },
  streakCore: {
    position: 'absolute',
    width: STREAK_LENGTH,
    height: STREAK_WIDTH,
    backgroundColor: colors.primary.main,
    borderRadius: STREAK_WIDTH / 2,
  },
  streakGlow: {
    position: 'absolute',
    width: STREAK_LENGTH,
    height: STREAK_WIDTH * 3,
    top: -STREAK_WIDTH,
    backgroundColor: colors.primary.main,
    borderRadius: STREAK_WIDTH * 1.5,
    opacity: 0.4,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.15,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  logo: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: SCREEN_HEIGHT * 0.15,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  phoneButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 90,
  },
  hintText: {
    fontSize: 14,
    color: colors.text.muted,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  legalContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: colors.text.muted,
    lineHeight: 16,
  },
  legalLink: {
    fontSize: 11,
    color: colors.primary.main,
    textDecorationLine: 'underline' as const,
    lineHeight: 16,
  },
});
