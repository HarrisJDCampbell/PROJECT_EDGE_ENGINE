/**
 * Analytics Service
 * Wraps Amplitude for event tracking.
 * All calls are no-ops if EXPO_PUBLIC_AMPLITUDE_API_KEY is not set.
 */

import { init, track, setUserId, reset, Identify, identify } from '@amplitude/analytics-react-native';

const API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? '';

let initialized = false;

export const analyticsService = {
  init: (userId?: string): void => {
    if (!API_KEY) {
      if (__DEV__) console.log('[Analytics] No API key — tracking disabled');
      return;
    }
    init(API_KEY, userId, {
      trackingOptions: {
        ipAddress: false,
        carrier: false,
      },
    });
    initialized = true;
    if (__DEV__) console.log('[Analytics] Initialized', userId ? `for user ${userId}` : 'anonymously');
  },

  identify: (userId: string, traits?: Record<string, any>): void => {
    if (!initialized) return;
    setUserId(userId);
    if (traits) {
      const identifyEvent = new Identify();
      Object.entries(traits).forEach(([key, value]) => identifyEvent.set(key, value));
      identify(identifyEvent);
    }
  },

  track: (event: string, properties?: Record<string, any>): void => {
    if (!initialized) {
      if (__DEV__) console.log(`[Analytics] track (no-op): ${event}`, properties ?? '');
      return;
    }
    track(event, properties);
  },

  reset: (): void => {
    if (!initialized) return;
    reset();
  },

  // Convenience screen tracking
  screen: (screenName: string, properties?: Record<string, any>): void => {
    analyticsService.track('Screen Viewed', { screen: screenName, ...properties });
  },
};
