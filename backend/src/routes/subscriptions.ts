/**
 * Subscriptions Routes
 * POST /api/subscriptions/sync     — sync RevenueCat info to Supabase (authenticated)
 * POST /api/subscriptions/webhook  — RevenueCat server-side webhook (public)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { invalidateTierCache } from '../middleware/subscriptionGate';
import logger from '../lib/logger';
import crypto from 'crypto';

const router = Router();

// ── POST /api/subscriptions/sync ──────────────────────────────────────────────
router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { revenuecat_customer_id, tier, expires_at } = req.body as {
      revenuecat_customer_id?: string;
      tier?: 'free' | 'starter' | 'pro';
      expires_at?: string | null;
    };

    if (!tier || !['free', 'starter', 'pro'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier value' });
      return;
    }

    // Verify the claimed tier against RevenueCat server API.
    // This prevents any authenticated user from self-upgrading via this endpoint.
    const rcSecretKey = process.env.REVENUECAT_SECRET_KEY;
    if (tier !== 'free') {
      if (!rcSecretKey) {
        // Fail closed: without the secret key we cannot verify the tier claim.
        // Don't silently allow unverified paid-tier writes.
        logger.warn(`[Subscriptions] Rejecting non-free sync for user ${req.userId} — REVENUECAT_SECRET_KEY not configured`);
        res.status(503).json({ error: 'Subscription verification is not available' });
        return;
      }
      try {
        // Use the Supabase user ID as the RevenueCat app user ID
        const rcUserId = revenuecat_customer_id ?? req.userId!;
        const rcRes = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(rcUserId)}`,
          {
            headers: {
              Authorization: `Bearer ${rcSecretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (rcRes.ok) {
          const rcData = (await rcRes.json()) as {
            subscriber?: { entitlements?: Record<string, { expires_date?: string }> };
          };
          const allEntitlements = rcData.subscriber?.entitlements ?? {};
          const now = new Date();
          const activeEntitlements = Object.keys(allEntitlements).filter((key) => {
            const ent = allEntitlements[key];
            if (!ent?.expires_date) return true; // lifetime entitlement
            return new Date(ent.expires_date) > now;
          });

          const tierIsValid =
            (tier === 'starter' &&
              (activeEntitlements.includes('starter') || activeEntitlements.includes('pro'))) ||
            (tier === 'pro' && activeEntitlements.includes('pro'));

          if (!tierIsValid) {
            console.warn(
              `[Subscriptions] Tier mismatch: user ${req.userId} claimed ${tier} but RC has [${activeEntitlements.join(', ')}]`
            );
            res.status(403).json({
              error: 'Tier claim does not match RevenueCat entitlements',
            });
            return;
          }
        } else {
          // RC API returned a non-200 status — fail closed to prevent unverified tier claims
          logger.warn(`[Subscriptions] RC API returned ${rcRes.status} for user ${req.userId} — rejecting sync`);
          res.status(503).json({ error: 'Subscription verification temporarily unavailable — please try again' });
          return;
        }
      } catch (rcErr: any) {
        // RC API network error — fail closed rather than trusting unverified claim
        logger.warn({ err: rcErr.message }, '[Subscriptions] RC verification failed — rejecting sync');
        res.status(503).json({ error: 'Subscription verification temporarily unavailable — please try again' });
        return;
      }
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(
        {
          user_id: req.userId!,
          tier,
          revenuecat_customer_id: revenuecat_customer_id ?? null,
          expires_at: expires_at ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      logger.error({ err: error.message }, '[Subscriptions] sync upsert error');
      res.status(500).json({ error: 'Failed to sync subscription' });
      return;
    }

    res.json({ subscription: data });
  } catch (err: any) {
    logger.error('[Subscriptions] sync error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ── POST /api/subscriptions/refresh-tier ─────────────────────────────────────
// Forces tier cache invalidation for the calling user after purchase/restore/promo
router.post('/refresh-tier', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Re-resolve tier: check active promo redemptions first, then user_subscriptions
    let tier: string = 'free';

    const now = new Date().toISOString();
    const { data: promo, error: promoError } = await supabase
      .from('promo_redemptions')
      .select('promo_tier, promo_expires_at')
      .eq('user_id', userId)
      .gt('promo_expires_at', now)
      .order('promo_expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promoError) {
      logger.error({ err: promoError.message }, '[Subscriptions] refresh-tier promo query error');
      res.status(500).json({ error: 'Failed to resolve tier' });
      return;
    }

    if (promo?.promo_tier) {
      tier = promo.promo_tier;
    } else {
      const { data: sub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) {
        logger.error({ err: subError.message }, '[Subscriptions] refresh-tier subscription query error');
        res.status(500).json({ error: 'Failed to resolve tier' });
        return;
      }

      tier = sub?.tier ?? 'free';
    }

    // Only invalidate cache after successful DB reads
    invalidateTierCache(userId);

    res.json({ tier, cacheCleared: true });
  } catch (err: any) {
    logger.error('[Subscriptions] refresh-tier error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ── POST /api/subscriptions/webhook ──────────────────────────────────────────
// RevenueCat sends a shared secret in the Authorization header
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      // No secret configured — reject all webhook calls rather than accepting them open
      res.status(503).json({ error: 'Webhook secret not configured' });
      return;
    }
    // Timing-safe comparison to prevent timing attacks
    const expected = Buffer.from(secret, 'utf8');
    const received = Buffer.from(req.headers.authorization ?? '', 'utf8');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      res.status(401).json({ error: 'Invalid webhook secret' });
      return;
    }

    const event = req.body as {
      event: {
        type: string;
        app_user_id: string;
        entitlement_ids?: string[];
        expiration_at_ms?: number;
        product_id?: string;
      };
    };

    const { type, app_user_id, entitlement_ids = [], expiration_at_ms } = event.event;

    const tierFromEntitlements = (): 'free' | 'starter' | 'pro' => {
      if (entitlement_ids.includes('pro')) return 'pro';
      if (entitlement_ids.includes('starter')) return 'starter';
      return 'free';
    };

    if (['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE'].includes(type)) {
      const tier = tierFromEntitlements();
      const { error } = await supabase.from('user_subscriptions').upsert(
        {
          user_id: app_user_id,
          tier,
          expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) {
        logger.error({ err: error.message, userId: app_user_id }, '[Subscriptions] webhook upsert error');
        res.status(500).json({ error: 'Failed to update subscription' });
        return;
      }
      invalidateTierCache(app_user_id);
    } else if (['CANCELLATION', 'EXPIRATION'].includes(type)) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ tier: 'free', expires_at: null, updated_at: new Date().toISOString() })
        .eq('user_id', app_user_id);
      if (error) {
        logger.error({ err: error.message, userId: app_user_id }, '[Subscriptions] webhook update error');
        res.status(500).json({ error: 'Failed to update subscription' });
        return;
      }
      invalidateTierCache(app_user_id);
    }

    res.json({ received: true, type });
  } catch (err: any) {
    logger.error('[Subscriptions] webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
