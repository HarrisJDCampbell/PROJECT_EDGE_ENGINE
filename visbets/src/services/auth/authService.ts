/**
 * Auth Service
 * Handles Google Sign-In → Supabase JWT exchange.
 * Flow: GoogleSignin.signIn() → idToken → supabase.auth.signInWithIdToken()
 */

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type { User, Session };

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

/**
 * Configure GoogleSignin — call once on app startup.
 */
export function configureGoogleSignin(): void {
  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

/**
 * Sign in with Google.
 * Returns the Supabase user/session on success, error on failure.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      return { user: null, session: null, error: new Error('No ID token returned from Google') };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { user: null, session: null, error: new Error('Sign in cancelled') };
    } else if (err.code === statusCodes.IN_PROGRESS) {
      return { user: null, session: null, error: new Error('Sign in already in progress') };
    } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { user: null, session: null, error: new Error('Google Play Services not available') };
    }
    return { user: null, session: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Sign out of both Supabase and Google.
 */
export async function signOut(): Promise<void> {
  await Promise.allSettled([
    supabase.auth.signOut(),
    GoogleSignin.revokeAccess(),
    GoogleSignin.signOut(),
  ]);
}

/**
 * Get the currently signed-in Supabase user.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Get the current session (includes access + refresh tokens).
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Send a phone OTP via Supabase.
 */
export async function signInWithPhone(phone: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error: error ?? null };
}

/**
 * Verify a phone OTP.
 */
export async function verifyPhoneCode(
  phone: string,
  token: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) return { user: null, session: null, error };
  return { user: data.user ?? null, session: data.session ?? null, error: null };
}

/**
 * Send an email OTP via Supabase (magic link + 6-digit OTP).
 * The magic link redirects to the app's deep link scheme so the user
 * lands back in the app automatically. The 6-digit code is a fallback
 * for email clients that mangle links.
 */
export async function signInWithEmailOtp(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: 'visbets://auth/callback',
    },
  });
  return { error: error ?? null };
}

/**
 * Verify an email OTP token.
 */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { user: null, session: null, error };
  return { user: data.user ?? null, session: data.session ?? null, error: null };
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 */
export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null, session ?? null);
    }
  );
  return () => subscription.unsubscribe();
}
