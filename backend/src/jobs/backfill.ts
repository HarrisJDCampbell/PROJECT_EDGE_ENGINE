/**
 * Backfill game_logs — fetches historical box scores from API-Sports
 * and upserts them into the game_logs table.
 *
 * Reuses the existing ingestBoxScores() from nightlyIngest.ts.
 * Adds a 1-second delay between dates to respect API-Sports rate limits.
 */

import logger from '../lib/logger';
import { ingestBoxScores } from './nightlyIngest';
import { invalidatePattern } from '../cache/gameCache';

let isRunning = false;

export function isBackfillRunning(): boolean {
  return isRunning;
}

export async function runBackfill(days: number): Promise<void> {
  if (isRunning) {
    logger.warn('[Backfill] Already running — skipping');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  let totalRows = 0;

  logger.info({ days }, '[Backfill] Starting historical game_logs backfill');

  // Flush cached schedule data so historical dates hit the API fresh.
  // Without this, stale cached responses (e.g., games that were "Not Started"
  // when first fetched) prevent the backfill from seeing "Game Finished" games.
  invalidatePattern('api-sports:games:');
  invalidatePattern('api-sports:boxscore:');

  try {
    for (let daysBack = days; daysBack >= 1; daysBack--) {
      const d = new Date();
      d.setDate(d.getDate() - daysBack);
      const dateStr = d.toISOString().split('T')[0];

      try {
        const rows = await ingestBoxScores(dateStr);
        totalRows += rows;
        if (rows > 0) {
          logger.info({ date: dateStr, rows }, '[Backfill] Date ingested');
        }
      } catch (err: any) {
        logger.warn({ date: dateStr, err: err.message }, '[Backfill] Date failed — continuing');
      }

      // Rate-limit: 1 second between dates to stay under API-Sports quota
      if (daysBack > 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    logger.info({ days, totalRows, elapsed }, '[Backfill] Complete');
  } catch (err: any) {
    logger.error({ err: err.message }, '[Backfill] Failed');
  } finally {
    isRunning = false;
  }
}
