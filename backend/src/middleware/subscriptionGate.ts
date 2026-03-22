/**
 * Subscription Gate Middleware
 *
 * Reads user tier from Supabase with a 5-minute in-process cache.
 * Also checks active promo_redemptions to honour beta promo codes.
 */

import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from './auth';

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

type Tier = 'free' | 'starter' | 'pro';

// ── In-process tier cache (5-minute TTL) ─────────────────────────────────────
const tierCache = new Map<string, { tier: Tier; expiresAt: number }>();
const TIER_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getUserTier(userId: string): Promise<Tier> {
  // Check cache first
  const cached = tierCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tier;
  }

  // Check active promo redemptions first — they override the subscription tier
  const now = new Date().toISOString();
  const { data: promo } = await supabase
    .from('promo_redemptions')
    .select('promo_tier, promo_expires_at')
    .eq('user_id', userId)
    .gt('promo_expires_at', now)
    .order('promo_expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let tier: Tier = 'free';

  if (promo?.promo_tier) {
    tier = promo.promo_tier as Tier;
  } else {
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle();

    tier = (sub?.tier as Tier) ?? 'free';
  }

  tierCache.set(userId, { tier, expiresAt: Date.now() + TIER_CACHE_TTL_MS });
  return tier;
}

/** Invalidate the tier cache for a user (call after promo redemption or subscription change). */
export function invalidateTierCache(userId: string): void {
  tierCache.delete(userId);
}

export async function requireStarter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }
  try {
    const tier = await getUserTier(req.userId);
    if (tier === 'free') {
      res.status(403).json({ error: 'upgrade_required', required_tier: 'starter' });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

