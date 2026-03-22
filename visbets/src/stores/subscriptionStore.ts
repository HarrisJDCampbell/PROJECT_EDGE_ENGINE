/**
 * VisBets Subscription Store
 * Manages subscription state with RevenueCat + Supabase sync.
 * Source of truth: RevenueCat (entitlements) + Supabase user_subscriptions (persistence).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import {
  SubscriptionTier,
  Entitlements,
  TIER_ENTITLEMENTS,
  REVENUECAT_CONFIG,
} from '../types/subscription';
import {
  initializeRevenueCat,
  loginUser,
  logoutUser,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  addCustomerInfoListener,
  isRevenueCatConfigured,
} from '../services/revenuecat/client';
import { supabase } from '../lib/supabase';
import { backendClient } from '../services/api/backendClient';
import { useAuthStore } from './authStore';

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  productId: string | null;
  entitlements: Entitlements;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  packages: PurchasesPackage[];
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  syncWithUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;

  // Dev-only tier override (wrapped in __DEV__ check at call sites)
  setTier: (tier: SubscriptionTier) => void;

  // Apply a tier from promo code redemption (works in prod)
  applyPromoTier: (tier: SubscriptionTier) => void;

  // Helpers
  hasFeature: (feature: keyof Entitlements) => boolean;
  isStarter: () => boolean;
  isPro: () => boolean;
  isPremium: () => boolean; // alias for isPro — kept for compat
}

const DEFAULT_ENTITLEMENTS = TIER_ENTITLEMENTS[SubscriptionTier.FREE];

// Module-level reference to the RevenueCat listener cleanup function.
// Ensures we never register more than one listener regardless of how many
// times initialize() is called.
let _rcListenerUnsubscribe: (() => void) | null = null;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: SubscriptionTier.FREE,
      isActive: false,
      expiresAt: null,
      willRenew: false,
      productId: null,
      entitlements: DEFAULT_ENTITLEMENTS,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      packages: [],
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const authState = useAuthStore.getState();
          const userId = authState.user?.id;
          await initializeRevenueCat(userId);

          let offerings = await getOfferings();

          // RevenueCat can be slow on first cold start — retry once after a short delay
          if (!offerings?.current?.availablePackages?.length) {
            if (__DEV__) console.log('[Subscription] No packages on first attempt — retrying in 3s');
            await new Promise((resolve) => setTimeout(resolve, 3000));
            offerings = await getOfferings();
          }

          if (offerings?.current?.availablePackages?.length) {
            set({ packages: offerings.current.availablePackages });
          } else {
            if (__DEV__) console.warn('[Subscription] No packages after retry — RevenueCat may not be configured');
          }

          await get().refreshSubscription();

          // Remove any existing listener before adding a new one
          if (_rcListenerUnsubscribe) {
            _rcListenerUnsubscribe();
            _rcListenerUnsubscribe = null;
          }
          _rcListenerUnsubscribe = addCustomerInfoListener(async (customerInfo) => {
            await updateFromCustomerInfo(customerInfo, set);
            // Re-check DB-backed promo tier on every RC update so that
            // expired promos are detected within the current session
            // (not only on app restart).
            await get().fetchSubscription();
          });
        } catch (error: any) {
          console.error('[Subscription] Init error:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSubscription: async () => {
        try {
          const customerInfo = await getCustomerInfo();
          if (customerInfo) {
            await updateFromCustomerInfo(customerInfo, set);
          }
        } catch (error: any) {
          console.error('[Subscription] Refresh error:', error);
        }
      },

      // Read tier from Supabase (user_subscriptions + promo_redemptions).
      // Uses the higher of subscription tier vs active promo tier.
      fetchSubscription: async () => {
        try {
          const authState = useAuthStore.getState();
          const userId = authState.user?.id;
          if (!userId) return;

          // Fetch subscription tier and active promo in parallel
          const [subResult, promoResult] = await Promise.all([
            supabase
              .from('user_subscriptions')
              .select('tier, expires_at')
              .eq('user_id', userId)
              .maybeSingle(),
            supabase
              .from('promo_redemptions')
              .select('promo_tier, promo_expires_at')
              .eq('user_id', userId)
              .gt('promo_expires_at', new Date().toISOString())
              .order('promo_expires_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (subResult.error && promoResult.error) {
            console.error('[Subscription] fetchSubscription DB error:', subResult.error.message);
            set({ tier: SubscriptionTier.FREE, isActive: false, entitlements: DEFAULT_ENTITLEMENTS });
            return;
          }

          const subData = subResult.data as { tier?: string; expires_at?: string | null } | null;
          const promoData = promoResult.data as { promo_tier?: string; promo_expires_at?: string | null } | null;

          const subTier = (subData?.tier as SubscriptionTier) ?? SubscriptionTier.FREE;
          const promoTier = (promoData?.promo_tier as SubscriptionTier) ?? SubscriptionTier.FREE;

          // Use the higher tier between subscription and promo
          const tierRank: Record<SubscriptionTier, number> = {
            [SubscriptionTier.FREE]: 0,
            [SubscriptionTier.STARTER]: 1,
            [SubscriptionTier.PRO]: 2,
          };
          const resolvedTier = tierRank[promoTier] > tierRank[subTier] ? promoTier : subTier;
          const expiresAt = resolvedTier === promoTier && promoTier !== SubscriptionTier.FREE
            ? promoData?.promo_expires_at ?? null
            : subData?.expires_at ?? null;

          const previousTier = get().tier;
          set({
            tier: resolvedTier,
            isActive: resolvedTier !== SubscriptionTier.FREE,
            expiresAt,
            entitlements: TIER_ENTITLEMENTS[resolvedTier],
          });

          // If tier changed, bust projections cache so the board re-fetches
          // with full (non-stripped) data for paying users
          if (resolvedTier !== previousTier) {
            import('../../app/_layout').then(({ getQueryClient }) => {
              getQueryClient().invalidateQueries({ queryKey: ['projections'] });
            }).catch(() => {});
          }
        } catch (error: any) {
          console.error('[Subscription] Fetch error:', error);
          set({ tier: SubscriptionTier.FREE, isActive: false, entitlements: DEFAULT_ENTITLEMENTS });
        }
      },

      purchase: async (pkg: PurchasesPackage) => {
        set({ isPurchasing: true, error: null });
        try {
          const customerInfo = await purchasePackage(pkg);
          if (customerInfo) {
            // updateFromCustomerInfo syncs tier to backend + busts cache
            await updateFromCustomerInfo(customerInfo, set);
            set({ isPurchasing: false });
            return true;
          }
          set({ isPurchasing: false });
          return false;
        } catch (error: any) {
          console.error('[Subscription] Purchase error:', error);
          set({ isPurchasing: false, error: error.message });
          return false;
        }
      },

      restore: async () => {
        set({ isRestoring: true, error: null });
        try {
          const customerInfo = await restorePurchases();
          await updateFromCustomerInfo(customerInfo, set);
          const restoredTier = get().tier;
          set({ isRestoring: false });
          // Return false if still free — nothing was actually restored
          return restoredTier !== SubscriptionTier.FREE;
        } catch (error: any) {
          console.error('[Subscription] Restore error:', error);
          set({ isRestoring: false, error: error.message });
          return false;
        }
      },

      syncWithUser: async (userId: string) => {
        try {
          if (!isRevenueCatConfigured()) {
            await initializeRevenueCat(userId);
          }
          const customerInfo = await loginUser(userId);
          await updateFromCustomerInfo(customerInfo, set);
        } catch (error: any) {
          console.error('[Subscription] Sync error:', error);
        }
      },

      logout: async () => {
        try {
          // Clean up listener before logging out
          if (_rcListenerUnsubscribe) {
            _rcListenerUnsubscribe();
            _rcListenerUnsubscribe = null;
          }
          await logoutUser();
          set({
            tier: SubscriptionTier.FREE,
            isActive: false,
            expiresAt: null,
            willRenew: false,
            productId: null,
            entitlements: DEFAULT_ENTITLEMENTS,
          });
          // Clear persisted subscription state so a new user doesn't
          // briefly inherit the previous user's tier on rehydration.
          try {
            await SecureStore.deleteItemAsync('visbets-subscription');
          } catch {
            // SecureStore may not be available (e.g., web) — non-fatal
          }
        } catch (error: any) {
          console.error('[Subscription] Logout error:', error);
        }
      },

      setTier: (tier: SubscriptionTier) => {
        if (__DEV__) {
          set({
            tier,
            isActive: tier !== SubscriptionTier.FREE,
            entitlements: TIER_ENTITLEMENTS[tier],
          });
        }
      },

      applyPromoTier: (tier: SubscriptionTier) => {
        set({
          tier,
          isActive: tier !== SubscriptionTier.FREE,
          entitlements: TIER_ENTITLEMENTS[tier],
        });
        // Bust the projections cache so the board re-fetches with full (non-stripped) data
        import('../../app/_layout').then(({ getQueryClient }) => {
          getQueryClient().invalidateQueries({ queryKey: ['projections'] });
        }).catch(() => {});
      },

      hasFeature: (feature: keyof Entitlements) => get().entitlements[feature],

      isStarter: () => {
        const { tier } = get();
        return tier === SubscriptionTier.STARTER || tier === SubscriptionTier.PRO;
      },

      isPro: () => get().tier === SubscriptionTier.PRO,

      isPremium: () => get().tier === SubscriptionTier.PRO, // alias
    }),
    {
      name: 'visbets-subscription',
      version: 1,
      storage: createJSONStorage(() => SecureStoreAdapter),
      partialize: (state) => ({
        tier: state.tier,
        isActive: state.isActive,
        expiresAt: state.expiresAt,
        // Don't persist entitlements — always derive from tier on rehydration
        // to avoid stale schema after app updates that change the Entitlements interface.
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if the persisted subscription has expired
          if (state.expiresAt && new Date(state.expiresAt).getTime() < Date.now()) {
            state.tier = SubscriptionTier.FREE;
            state.isActive = false;
            state.expiresAt = null;
          }
          state.entitlements = TIER_ENTITLEMENTS[state.tier] ?? DEFAULT_ENTITLEMENTS;
        }
      },
    }
  )
);

/**
 * Update store from a RevenueCat CustomerInfo object.
 * Also syncs the tier to Supabase via the backend.
 */
async function updateFromCustomerInfo(
  customerInfo: CustomerInfo,
  set: (state: Partial<SubscriptionState>) => void
): Promise<void> {
  const { active } = customerInfo.entitlements;

  let tier = SubscriptionTier.FREE;
  let isActive = false;
  let expiresAt: string | null = null;
  let willRenew = false;
  let productId: string | null = null;

  // Check Pro entitlement first (higher tier)
  const proEntitlement = active[REVENUECAT_CONFIG.ENTITLEMENTS.PRO];
  if (proEntitlement) {
    tier = SubscriptionTier.PRO;
    isActive = true;
    expiresAt = proEntitlement.expirationDate;
    willRenew = proEntitlement.willRenew;
    productId = proEntitlement.productIdentifier;
  } else {
    // Check Starter entitlement
    const starterEntitlement = active[REVENUECAT_CONFIG.ENTITLEMENTS.STARTER];
    if (starterEntitlement) {
      tier = SubscriptionTier.STARTER;
      isActive = true;
      expiresAt = starterEntitlement.expirationDate;
      willRenew = starterEntitlement.willRenew;
      productId = starterEntitlement.productIdentifier;
    }
  }

  // If RevenueCat says FREE, check whether an active promo should take precedence.
  // This prevents the RC listener from overwriting promo-granted access.
  if (tier === SubscriptionTier.FREE) {
    const currentState = useSubscriptionStore.getState();
    const currentTier = currentState.tier;
    if (currentTier !== SubscriptionTier.FREE) {
      // Keep the current (promo/cached) tier, but immediately verify against DB
      if (__DEV__) console.log(`[Subscription] RC says free but current tier is ${currentTier} — preserving (likely promo), verifying...`);
      // Schedule a DB check to verify the promo is still active
      setTimeout(() => useSubscriptionStore.getState().fetchSubscription(), 0);
      return;
    }
  }

  set({
    tier,
    isActive,
    expiresAt,
    willRenew,
    productId,
    entitlements: TIER_ENTITLEMENTS[tier],
  });

  if (__DEV__) console.log(`[Subscription] Updated: tier=${tier}, active=${isActive}`);

  // Sync tier to backend database (non-blocking).
  // This covers automatic renewals and expirations detected by the RevenueCat SDK,
  // which may fire before the RevenueCat webhook reaches the backend.
  try {
    await backendClient.post('/api/subscriptions/sync', {
      tier,
      revenuecat_customer_id: customerInfo.originalAppUserId,
      expires_at: expiresAt,
    });
    await backendClient.post('/api/subscriptions/refresh-tier');
  } catch {
    // Non-fatal — the RevenueCat webhook is the guaranteed sync path.
    // Log in dev only to avoid spamming Sentry on network errors.
    if (__DEV__) console.warn('[Subscription] Background sync to backend failed (non-fatal)');
  }
}
