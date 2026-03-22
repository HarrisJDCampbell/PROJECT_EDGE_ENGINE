/**
 * Admin Routes (protected by ADMIN_API_KEY)
 * POST /api/admin/backfill — trigger historical game_logs backfill
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { runBackfill, isBackfillRunning } from '../jobs/backfill';
import { runOddsRefresh } from '../jobs/oddsRefresh';
import logger from '../lib/logger';

const router = Router();

// API key auth for admin endpoints — fails closed if ADMIN_API_KEY is unset
function requireAdminKey(req: Request, res: Response, next: () => void): void {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Admin API key not configured on server' });
    return;
  }
  const provided = String(
    req.headers['x-admin-key'] ?? req.headers.authorization?.replace('Bearer ', '') ?? ''
  );
  const expected = Buffer.from(key, 'utf8');
  const received = Buffer.from(provided, 'utf8');
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    res.status(401).json({ error: 'Invalid admin key' });
    return;
  }
  next();
}

router.post('/backfill', requireAdminKey, (req: Request, res: Response) => {
  if (isBackfillRunning()) {
    res.json({ started: false, message: 'Backfill already in progress' });
    return;
  }

  const parsed = Number(req.body?.days);
  const days = Math.min(Math.max(isNaN(parsed) ? 30 : parsed, 1), 60);

  logger.info({ action: 'backfill', days, ip: req.ip }, '[Admin] Backfill triggered');

  // Fire and forget — backfill runs in the background
  runBackfill(days).catch((err) => {
    logger.error({ err: err.message }, '[Admin] Backfill failed');
  });

  res.json({ started: true, days, message: `Backfill started for ${days} days of history` });
});

router.post('/refresh-odds', requireAdminKey, (req: Request, res: Response) => {
  logger.info({ action: 'refresh-odds', ip: req.ip }, '[Admin] Odds refresh triggered');

  runOddsRefresh().catch((err) => {
    logger.error({ err: err.message }, '[Admin] Odds refresh failed');
  });
  res.json({ started: true, message: 'Odds refresh triggered' });
});

export default router;
