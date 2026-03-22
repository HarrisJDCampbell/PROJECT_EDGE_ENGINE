/**
 * Authentication Types
 */

export interface User {
  id: string;
  email?: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface OnboardingData {
  username: string;
  sportsbooks: string[];
  sports: string[];
}

export const ONBOARDING_STEPS = {
  USERNAME: 0,
  SPORTSBOOKS: 1,
  SPORTS: 2,
  WELCOME: 3,
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];
