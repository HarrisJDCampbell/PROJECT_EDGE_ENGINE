/**
 * VisBets Auth Store
 * Manages authentication state via Supabase.
 * Firebase has been removed — auth is now Google Sign-In → Supabase JWT.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User, Session } from '@supabase/supabase-js';
import {
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,
  signOut as authServiceSignOut,
} from '../services/auth/authService';
import { supabase } from '../lib/supabase';
import { clearTokenCache } from '../services/api/backendClient';
import { useOnboardingStore } from './onboardingStore';

// SecureStore adapter for zustand persist (with in-memory fallback)
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try { await SecureStore.setItemAsync(key, value); } catch { /* silent */ }
  },
  removeItem: async (key: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(key); } catch { /* silent */ }
  },
};

export interface AppUser {
  id: string;
  email: string | undefined;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  username?: string;
  onboardingComplete: boolean;
  createdAt: string;
}

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  devBypass: boolean;

  // Actions
  setUser: (user: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setDevBypass: (bypass: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isInitialized: false,
      devBypass: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setDevBypass: (devBypass) => set({ devBypass }),

      initialize: async () => {
        try {
          set({ isLoading: true });

          const supabaseUser = await getCurrentUser();
          const session = await getCurrentSession();

          if (supabaseUser) {
            if (__DEV__) console.log('[Auth] Supabase user found:', supabaseUser.email);
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url, username, onboarding_complete, created_at')
              .eq('id', supabaseUser.id)
              .maybeSingle();

            set({
              user: buildAppUser(supabaseUser, profile),
              session,
            });

            // Load saved preferences from Supabase into onboarding store
            const { data: prefs } = await supabase
              .from('user_preferences')
              .select('sportsbooks, sports')
              .eq('user_id', supabaseUser.id)
              .maybeSingle() as { data: { sportsbooks: string[] | null; sports: string[] | null } | null };

            if (prefs) {
              const { selectedSportsbooks, selectedSports } = useOnboardingStore.getState();
              if (prefs.sportsbooks?.length && selectedSportsbooks.length === 0) {
                useOnboardingStore.setState({ selectedSportsbooks: prefs.sportsbooks });
              }
              if (prefs.sports?.length && selectedSports.length === 0) {
                useOnboardingStore.setState({ selectedSports: prefs.sports });
              }
            }
          } else {
            if (__DEV__) console.log('[Auth] No Supabase user found');
            set({ user: null, session: null });
          }
        } catch (error) {
          console.error('[Auth] Initialization error:', error);
          set({ user: null, session: null });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      signOut: async () => {
        // Tear down RevenueCat session and clear subscription state BEFORE
        // clearing auth state — order matters to avoid interim access windows.
        try {
          const { useSubscriptionStore } = await import('./subscriptionStore');
          await useSubscriptionStore.getState().logout();
        } catch (e) {
          console.error('[Auth] Failed to clear subscription state:', e);
        }

        // Clear user-specific stores to prevent data leaking between accounts
        try {
          useOnboardingStore.getState().reset();
          const { useUserStatsStore } = await import('./userStatsStore');
          useUserStatsStore.getState().resetStats();
        } catch (e) {
          console.error('[Auth] Failed to clear user stores:', e);
        }

        // Clear React Query cache to prevent cross-user data leakage.
        try {
          const { getQueryClient } = await import('../../app/_layout');
          getQueryClient().clear();
        } catch (e) {
          console.error('[Auth] Failed to clear query cache:', e);
        }

        clearTokenCache();
        await authServiceSignOut();
        set({ user: null, session: null, devBypass: false });
      },

      refreshUser: async () => {
        const supabaseUser = await getCurrentUser();
        if (!supabaseUser) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, username, onboarding_complete, created_at')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (profile) {
          set({ user: buildAppUser(supabaseUser, profile) });
        }
      },
    }),
    {
      name: 'visbets-auth',
      storage: createJSONStorage(() => SecureStoreAdapter),
      partialize: () => ({}), // Don't persist — Supabase SecureStore handles session
    }
  )
);

function buildAppUser(
  supabaseUser: User,
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    onboarding_complete: boolean;
    created_at: string;
  } | null
): AppUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? undefined,
    displayName:
      profile?.display_name ??
      (supabaseUser.user_metadata?.full_name as string | undefined) ??
      undefined,
    avatarUrl:
      profile?.avatar_url ??
      (supabaseUser.user_metadata?.avatar_url as string | undefined) ??
      undefined,
    username: profile?.username ?? undefined,
    onboardingComplete: profile?.onboarding_complete ?? false,
    createdAt: profile?.created_at ?? supabaseUser.created_at ?? new Date().toISOString(),
  };
}

/**
 * Set up a Supabase auth state listener.
 * This is the single source of truth for auth state changes.
 * It sets isInitialized=true after the FIRST event (INITIAL_SESSION or equivalent),
 * which replaces the separate initialize() call for the cold-start flow.
 * Returns an unsubscribe function — call in useEffect cleanup.
 */
export function setupAuthListener(): () => void {
  let isFirstEvent = true;

  return onAuthStateChange(async (supabaseUser, session) => {
    const store = useAuthStore.getState();

    if (supabaseUser) {
      if (__DEV__) console.log('[Auth] Auth event: user present:', supabaseUser.email);

      // Verify the user still exists server-side (handles account deletion while session cached)
      if (isFirstEvent) {
        const { error: verifyError } = await supabase.auth.getUser();
        if (verifyError) {
          if (__DEV__) console.log('[Auth] Cached session invalid — user deleted server-side, clearing state');
          isFirstEvent = false;
          useAuthStore.setState({ user: null, session: null, isLoading: false, isInitialized: true });
          // Defer signOut to next tick to avoid re-entering this listener
          setTimeout(() => supabase.auth.signOut(), 0);
          return;
        }
      }

      // Fetch profile BEFORE setting isInitialized — blocking so auth guard
      // sees the correct onboardingComplete value on first evaluation
      let profile: {
        display_name: string | null;
        avatar_url: string | null;
        username: string | null;
        onboarding_complete: boolean;
        created_at: string;
      } | null = null;
      try {
        // Timeout profile fetch to prevent infinite hang on slow networks
        const profilePromise = supabase
          .from('profiles')
          .select('display_name, avatar_url, username, onboarding_complete, created_at')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timed out')), 8000)
        );
        const { data } = await Promise.race([profilePromise, timeoutPromise]);
        profile = data;
      } catch (err) {
        console.error('[Auth] Profile fetch failed:', err);
        // Continue with null profile — user will be routed to onboarding
      }

      // Batch user + session into a single setState to prevent intermediate
      // renders where session is set but user is stale (or vice versa)
      useAuthStore.setState({
        user: buildAppUser(supabaseUser, profile),
        session,
      });

      // Load saved preferences from Supabase into onboarding store
      if (profile?.onboarding_complete) {
        try {
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('sportsbooks, sports')
            .eq('user_id', supabaseUser.id)
            .maybeSingle() as { data: { sportsbooks: string[] | null; sports: string[] | null } | null };

          if (prefs) {
            const { selectedSportsbooks, selectedSports } = useOnboardingStore.getState();
            if (prefs.sportsbooks?.length && selectedSportsbooks.length === 0) {
              useOnboardingStore.setState({ selectedSportsbooks: prefs.sportsbooks });
            }
            if (prefs.sports?.length && selectedSports.length === 0) {
              useOnboardingStore.setState({ selectedSports: prefs.sports });
            }
          }
        } catch (err) {
          console.error('[Auth] Preferences fetch failed:', err);
        }
      }
    } else {
      if (__DEV__) console.log('[Auth] Auth event: signed out');
      useAuthStore.setState({ user: null, session: null });
    }

    // Mark initialization complete AFTER user+profile are fully loaded
    if (isFirstEvent) {
      isFirstEvent = false;
      useAuthStore.setState({ isLoading: false, isInitialized: true });
    }
  });
}
