/**
 * Odds Routes
 * GET /api/odds/nba
 * GET /api/odds/quota
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getNBAOdds, getOddsUsageStats } from '../services/oddsApi';
import logger from '../lib/logger';

const router = Router();

// ── GET /api/odds/nba ─────────────────────────────────────────────────────────
router.get('/nba', requireAuth, async (_req: Request, res: Response) => {
  try {
    const odds = await getNBAOdds();
    res.json({ odds, count: odds.length });
  } catch (err: any) {
    logger.error('[Odds] nba error:', err.message);
    res.status(500).json({ error: 'Failed to fetch NBA odds' });
  }
});

// ── GET /api/odds/quota ───────────────────────────────────────────────────────
router.get('/quota', requireAuth, async (_req: Request, res: Response) => {
  const stats = getOddsUsageStats();
  // Monthly reset is approximate — TheOddsAPI resets on billing cycle
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  res.json({ ...stats, resetDate });
});

export default router;
