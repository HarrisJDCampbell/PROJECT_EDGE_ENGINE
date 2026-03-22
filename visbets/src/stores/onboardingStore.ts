/**
 * VisBets Onboarding Store
 * Persists sportsbook/sport selections locally via AsyncStorage.
 * Writes onboarding_complete and display_name to Supabase profiles directly.
 * Firebase dependency removed.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STEPS } from '../types/auth';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface OnboardingState {
  currentStep: number;
  username: string;
  selectedSportsbooks: string[];
  selectedSports: string[];
  isSubmitting: boolean;
  error: string | null;

  setUsername: (username: string) => void;
  toggleSportsbook: (sportsbook: string) => void;
  toggleSport: (sport: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  submitOnboarding: () => Promise<boolean>;
}

const MAX_SPORTSBOOKS = 2;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: ONBOARDING_STEPS.USERNAME,
      username: '',
      selectedSportsbooks: [],
      selectedSports: [],
      isSubmitting: false,
      error: null,

      setUsername: (username) => set({ username, error: null }),

      toggleSportsbook: (sportsbook) => {
        const current = get().selectedSportsbooks;
        if (current.includes(sportsbook)) {
          set({ selectedSportsbooks: current.filter((s) => s !== sportsbook) });
        } else if (current.length < MAX_SPORTSBOOKS) {
          set({ selectedSportsbooks: [...current, sportsbook] });
        }
      },

      toggleSport: (sport) => {
        const current = get().selectedSports;
        if (current.includes(sport)) {
          set({ selectedSports: current.filter((s) => s !== sport) });
        } else {
          set({ selectedSports: [...current, sport] });
        }
      },

      nextStep: () => {
        const step = get().currentStep;
        if (step < ONBOARDING_STEPS.WELCOME) set({ currentStep: step + 1 });
      },

      prevStep: () => {
        const step = get().currentStep;
        if (step > ONBOARDING_STEPS.USERNAME) set({ currentStep: step - 1 });
      },

      reset: () =>
        set({
          currentStep: ONBOARDING_STEPS.USERNAME,
          username: '',
          selectedSportsbooks: [],
          selectedSports: [],
          isSubmitting: false,
          error: null,
        }),

      submitOnboarding: async () => {
        const { username, selectedSportsbooks, selectedSports } = get();
        const authState = useAuthStore.getState();
        const userId = authState.user?.id;
        const devBypass = authState.devBypass;

        if (devBypass) {
          set({ isSubmitting: false });
          return true;
        }

        if (!userId) {
          set({ error: 'Not authenticated' });
          return false;
        }

        set({ isSubmitting: true, error: null });

        try {
          // 1. Upsert profiles (username + display_name + onboarding flag)
          // Uses upsert instead of update so new users (no profile row yet) get created
          const profileData: { id: string; onboarding_complete: boolean; display_name?: string; username?: string } = {
            id: userId,
            onboarding_complete: true,
          };
          if (username.trim()) {
            profileData.display_name = username.trim();
            profileData.username = username.trim().toLowerCase();
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (profileError) throw profileError;

          // 2. Upsert user preferences (sportsbooks + sports)
          const { error: prefError } = await supabase.from('user_preferences').upsert(
            {
              user_id: userId,
              sportsbooks: selectedSportsbooks,
              sports: selectedSports,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
          if (prefError) {
            console.warn('[Onboarding] Failed to save preferences:', prefError.message);
          }

          await useAuthStore.getState().refreshUser();

          set({ isSubmitting: false });
          return true;
        } catch (error: any) {
          set({
            isSubmitting: false,
            error: error?.message || 'Failed to complete onboarding',
          });
          return false;
        }
      },
    }),
    {
      name: 'visbets-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedSportsbooks: state.selectedSportsbooks,
        selectedSports: state.selectedSports,
        username: state.username,
      }),
    }
  )
);
