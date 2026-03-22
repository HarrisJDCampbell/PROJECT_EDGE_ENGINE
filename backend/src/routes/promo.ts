/**
 * Promo Code Routes
 * POST /api/promo/redeem — validate and apply a promo code for the authenticated user
 */

import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { invalidateTierCache } from '../middleware/subscriptionGate';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import logger from '../lib/logger';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.post('/redeem', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const code   = (req.body?.code as string)?.trim().toUpperCase();

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  try {
    // Atomic check-and-redeem via Supabase RPC (prevents race conditions)
    const { data, error: rpcError } = await supabaseAdmin.rpc('redeem_promo_code', {
      p_code: code,
      p_user_id: userId,
    });

    if (rpcError) throw rpcError;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      res.status(500).json({ error: 'Unexpected empty response from redemption' });
      return;
    }

    // Handle error codes returned by the RPC function
    if (result.error_code) {
      const errorMap: Record<string, { status: number; message: string }> = {
        invalid_code:    { status: 404, message: 'Code not found' },
        code_expired:    { status: 410, message: 'This code has expired' },
        code_exhausted:  { status: 410, message: 'This code has reached its maximum uses' },
        already_redeemed:{ status: 409, message: 'You have already used this code' },
      };
      const err = errorMap[result.error_code] ?? { status: 400, message: result.error_code };
      res.status(err.status).json({ error: result.error_code, message: err.message });
      return;
    }

    // Invalidate the cached tier so the next request reflects the promo
    invalidateTierCache(userId);

    logger.info({ userId, code, tier: result.promo_tier }, '[Promo] Code redeemed');

    res.json({
      success: true,
      tier:          result.promo_tier,
      expiresAt:     result.promo_expires_at,
      durationDays:  result.duration_days,
      message: `${result.promo_tier.toUpperCase()} access activated for ${result.duration_days} days`,
    });
  } catch (err: any) {
    logger.error({ err: err.message, userId, code }, '[Promo] Redemption failed');
    res.status(500).json({ error: 'Redemption failed. Please try again.' });
  }
});

export default router;
