/**
 * Games Routes
 * GET /api/games/today
 * GET /api/games/:gameId/boxscore
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTodaysGames, getGameBoxScore } from '../services/apiSports';
import logger from '../lib/logger';

const router = Router();

// ── GET /api/games/today ──────────────────────────────────────────────────────
router.get('/today', requireAuth, async (_req: Request, res: Response) => {
  try {
    const games = await getTodaysGames();
    res.json({ games, count: games.length });
  } catch (err: any) {
    logger.error({ err: err.message }, '[Games] today error');
    res.status(500).json({ error: 'Failed to fetch today\'s games' });
  }
});

// ── GET /api/games/:gameId/boxscore ───────────────────────────────────────────
router.get('/:gameId/boxscore', requireAuth, async (req: Request, res: Response) => {
  try {
    const gameId = Number(req.params.gameId);
    if (isNaN(gameId)) {
      res.status(400).json({ error: 'Invalid gameId' });
      return;
    }
    const boxscore = await getGameBoxScore(gameId);
    res.json({ gameId, players: boxscore });
  } catch (err: any) {
    logger.error({ err: err.message }, '[Games] boxscore error');
    res.status(500).json({ error: 'Failed to fetch boxscore' });
  }
});

export default router;
