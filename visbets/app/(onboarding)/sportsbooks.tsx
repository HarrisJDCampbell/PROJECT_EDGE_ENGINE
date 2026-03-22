/**
 * Sportsbooks Screen
 * Step 2: Select your top sportsbooks
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/styles';
import { typography } from '../../src/theme/typography';
import { NeonButton } from '../../src/components/shared/NeonButton';
import { OnboardingProgress } from '../../src/components/auth/OnboardingProgress';
import { SelectableChip } from '../../src/components/auth/SelectableChip';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { SPORTSBOOKS } from '../../src/utils/constants';
import { ONBOARDING_STEPS } from '../../src/types/auth';

const MAX_SELECTIONS = 2;

export default function SportsbooksScreen() {
  const router = useRouter();
  const { selectedSportsbooks, toggleSportsbook } = useOnboardingStore();

  const handleContinue = () => {
    if (selectedSportsbooks.length >= 1) {
      router.push('/(onboarding)/sports');
    }
  };

  const isAtLimit = selectedSportsbooks.length >= MAX_SELECTIONS;
  const canContinue = selectedSportsbooks.length >= 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress
            currentStep={ONBOARDING_STEPS.SPORTSBOOKS}
            totalSteps={3}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select your sportsbooks</Text>
          <Text style={styles.subtitle}>
            Choose up to {MAX_SELECTIONS} books you use most
          </Text>
          <Text style={styles.hint}>You can change this later in settings</Text>
        </View>

        {/* Selection Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {selectedSportsbooks.length} of {MAX_SELECTIONS} selected
          </Text>
        </View>

        {/* Sportsbooks List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {SPORTSBOOKS.map((book) => {
            const isSelected = selectedSportsbooks.includes(book.id);
            const isDisabled = isAtLimit && !isSelected;

            return (
              <SelectableChip
                key={book.id}
                label={book.name}
                selected={isSelected}
                onPress={() => toggleSportsbook(book.id)}
                disabled={isDisabled}
              />
            );
          })}
        </ScrollView>

        {/* Continue Button */}
        <NeonButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    paddingBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  progressContainer: {
    marginBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  countContainer: {
    marginBottom: spacing.lg,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
});
