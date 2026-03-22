/**
 * Sports Screen
 * Step 3: Select sports you bet on
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
import { SPORTS } from '../../src/utils/constants';
import { ONBOARDING_STEPS } from '../../src/types/auth';

// Map sport icons to Ionicons names
const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  basketball: 'basketball-outline',
  'american-football': 'american-football-outline',
  baseball: 'baseball-outline',
  'hockey-puck': 'snow-outline', // No hockey icon, using substitute
  football: 'football-outline',
  fitness: 'fitness-outline',
  golf: 'golf-outline',
  tennisball: 'tennisball-outline',
  school: 'school-outline',
};

export default function SportsScreen() {
  const router = useRouter();
  const { selectedSports, toggleSport, submitOnboarding, isSubmitting } = useOnboardingStore();

  const handleContinue = async () => {
    if (selectedSports.length >= 1) {
      // Submit onboarding data before moving to welcome screen
      const success = await submitOnboarding();
      if (success) {
        router.push('/(onboarding)/welcome');
      }
    }
  };

  const canContinue = selectedSports.length >= 1;

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
            currentStep={ONBOARDING_STEPS.SPORTS}
            totalSteps={3}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What do you bet on?</Text>
          <Text style={styles.subtitle}>
            Select the sports you're interested in
          </Text>
          <Text style={styles.hint}>You can change this later in settings</Text>
        </View>

        {/* Selection Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {selectedSports.length} selected
          </Text>
        </View>

        {/* Sports List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport.id);
            const iconName = SPORT_ICONS[sport.icon] || 'ellipse-outline';

            return (
              <SelectableChip
                key={sport.id}
                label={sport.name}
                selected={isSelected}
                onPress={() => toggleSport(sport.id)}
                icon={iconName}
              />
            );
          })}
        </ScrollView>

        {/* Continue Button */}
        <NeonButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          loading={isSubmitting}
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
