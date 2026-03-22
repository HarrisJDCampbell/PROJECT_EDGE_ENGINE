/**
 * Purchases Service
 * Thin wrapper used by _layout.tsx for initialization and sync.
 * Actual purchase logic lives in subscriptionStore.
 */

import { initializeRevenueCat, loginUser, logoutUser } from '../revenuecat/client';
import { backendClient } from '../api/backendClient';
import { SubscriptionTier } from '../../types/subscription';

export const purchasesService = {
  /**
   * Initialize RevenueCat and identify the user.
   * Call once after auth resolves.
   */
  initializePurchases: async (userId: string): Promise<void> => {
    try {
      await initializeRevenueCat(userId);
      await loginUser(userId);
      if (__DEV__) console.log('[Purchases] Initialized for user:', userId);
    } catch (error) {
      console.error('[Purchases] Initialization error:', error);
    }
  },

  /**
   * Sync the current tier + expiry to the backend Supabase record.
   * Call after a successful purchase or restore.
   */
  syncSubscription: async (
    tier: SubscriptionTier,
    revenuecatCustomerId?: string,
    expiresAt?: string | null
  ): Promise<void> => {
    try {
      await backendClient.post('/api/subscriptions/sync', {
        tier,
        revenuecat_customer_id: revenuecatCustomerId ?? null,
        expires_at: expiresAt ?? null,
      });
    } catch (error) {
      console.error('[Purchases] Sync error:', error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('[Purchases] Logout error:', error);
    }
  },
};
