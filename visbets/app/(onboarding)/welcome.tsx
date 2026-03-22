/**
 * Welcome Screen
 * Step 4: Thank you message from founders
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/styles';
import { typography } from '../../src/theme/typography';
import { GlowText } from '../../src/components/shared/GlowText';
import { NeonCard } from '../../src/components/shared/NeonCard';
import { NeonButton } from '../../src/components/shared/NeonButton';
import { OnboardingProgress } from '../../src/components/auth/OnboardingProgress';
import { ONBOARDING_STEPS } from '../../src/types/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  // Sportsbook/sport selections persist in the onboarding store for the board

  // Animation values
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate checkmark
    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in content
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStart = () => {
    // Navigate to main app — DON'T call reset() here because it clears
    // selectedSportsbooks/selectedSports from AsyncStorage. Those need to
    // persist for the board's left/right sportsbook columns. The store is
    // reset on sign-out (authStore.signOut) for cross-user data isolation.
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress
            currentStep={ONBOARDING_STEPS.WELCOME}
            totalSteps={3}
          />
        </View>

        {/* Checkmark Animation */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            { transform: [{ scale: checkmarkScale }] },
          ]}
        >
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={48} color={colors.background.primary} />
          </View>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: contentOpacity }]}>
          <GlowText size="xl" style={styles.title}>
            You're all set!
          </GlowText>
          <Text style={styles.subtitle}>
            Welcome to the VisBets community
          </Text>
        </Animated.View>

        {/* Founder Message */}
        <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
          <NeonCard style={styles.messageCard} glowIntensity="subtle">
            <Text style={styles.messageText}>
              Thank you for taking the time to use and help us test VisBets! Your feedback is invaluable. If you run into any bugs, you can report them using the "Report a Bug" button at the bottom of your Profile page.
            </Text>
            <View style={styles.signature}>
              <Text style={styles.signatureText}>— Harris Campbell & Lewis Campbell</Text>
              <Text style={styles.signatureRole}>Founders</Text>
            </View>
          </NeonCard>
        </Animated.View>

        {/* Start Button */}
        <Animated.View style={{ opacity: contentOpacity }}>
          <NeonButton
            title="Start Exploring"
            onPress={handleStart}
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  progressContainer: {
    marginBottom: spacing['2xl'],
  },
  checkmarkContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  messageCard: {
    marginBottom: spacing['2xl'],
  },
  messageText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  signature: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.md,
  },
  signatureText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.primary.main,
  },
  signatureRole: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
