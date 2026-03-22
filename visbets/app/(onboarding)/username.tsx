/**
 * Username Screen
 * Step 1: Choose your username
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/styles';
import { typography } from '../../src/theme/typography';
import { NeonButton } from '../../src/components/shared/NeonButton';
import { OnboardingProgress } from '../../src/components/auth/OnboardingProgress';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { checkUsernameAvailable } from '../../src/services/supabase/usernameCheck';
import { USERNAME_RULES } from '../../src/utils/constants';
import { ONBOARDING_STEPS } from '../../src/types/auth';

const USERNAME_CHECK_DEBOUNCE_MS = 500;

export default function UsernameScreen() {
  const router = useRouter();
  const { username, setUsername } = useOnboardingStore();
  const signOut = useAuthStore((s) => s.signOut);

  const [localUsername, setLocalUsername] = useState(username);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | undefined>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const validateUsername = (value: string): string | undefined => {
    if (value.length < USERNAME_RULES.MIN_LENGTH) {
      return `Username must be at least ${USERNAME_RULES.MIN_LENGTH} characters`;
    }
    if (value.length > USERNAME_RULES.MAX_LENGTH) {
      return `Username must be at most ${USERNAME_RULES.MAX_LENGTH} characters`;
    }
    if (!USERNAME_RULES.PATTERN.test(value)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    return undefined;
  };

  const handleUsernameChange = useCallback((value: string) => {
    // Convert to lowercase and remove spaces — synchronous, keeps input responsive
    const cleaned = value.toLowerCase().replace(/\s/g, '');
    setLocalUsername(cleaned);
    setIsAvailable(null);

    // Cancel any pending availability check
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const validationError = validateUsername(cleaned);
    if (validationError) {
      setError(validationError);
      setIsChecking(false);
      return;
    }

    setError(undefined);
    setIsChecking(true);

    // Debounce the API call so we don't fire on every keystroke
    debounceRef.current = setTimeout(async () => {
      try {
        const { available, error: checkError } = await checkUsernameAvailable(cleaned);
        // Only update if this is still the current username (avoid stale results)
        const current = cleaned; // captured in closure
        setLocalUsername((prev) => {
          if (prev !== current) return prev; // stale — skip update
          if (checkError) {
            setError('Could not check availability');
          } else {
            setIsAvailable(available);
            if (!available) {
              setError('Username is already taken');
            }
          }
          return prev;
        });
      } catch {
        setError('Could not check availability');
      } finally {
        setIsChecking(false);
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);
  }, []);

  const handleContinue = () => {
    if (isAvailable && !error) {
      setUsername(localUsername);
      router.push('/(onboarding)/sportsbooks');
    }
  };

  const getHint = () => {
    if (isChecking) return 'Checking availability...';
    if (isAvailable === true) return 'Username is available!';
    return `${localUsername.length}/${USERNAME_RULES.MAX_LENGTH} characters`;
  };

  const canContinue = isAvailable === true && !error && !isChecking;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Back button — sign out to clear the cached session, then auth guard routes to login */}
          <TouchableOpacity style={styles.backButton} onPress={() => signOut()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <OnboardingProgress
              currentStep={ONBOARDING_STEPS.USERNAME}
              totalSteps={3}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              This name will be displayed on your personal profile
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
              <TextInput
                value={localUsername}
                onChangeText={handleUsernameChange}
                placeholder="username"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                style={styles.textInput}
                selectionColor={colors.primary.main}
              />
            </View>
            {error && <Text style={styles.inputError}>{error}</Text>}
            {!error && <Text style={styles.inputHint}>{getHint()}</Text>}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Continue Button */}
          <NeonButton
            title="Continue"
            onPress={handleContinue}
            disabled={!canContinue}
            loading={isChecking}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    paddingBottom: spacing.md,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  progressContainer: {
    marginBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
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
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  inputWrapperError: {
    borderColor: colors.semantic.danger,
  },
  textInput: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputError: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
    marginTop: spacing.xs,
  },
  inputHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});
