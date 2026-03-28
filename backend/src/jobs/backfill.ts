/**
 * Backfill game_logs — fetches historical box scores from API-Sports
 * and upserts them into the game_logs table.
 *
 * Reuses the existing ingestBoxScores() from nightlyIngest.ts.
 * Uses 3-second delays between dates to avoid starving live user requests
 * and competing with the odds refresh cron for API-Sports rate limits.
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
          logger.info({ date: dateStr, rows, totalRows }, '[Backfill] Date ingested');
        }
      } catch (err: any) {
        logger.warn({ date: dateStr, err: err.message }, '[Backfill] Date failed — continuing');
      }

      // 3-second delay between dates — gives breathing room for user requests
      // and odds refresh cron. Each date fetches 5-15 box scores, so this
      // keeps API-Sports usage well under rate limits.
      if (daysBack > 1) {
        await new Promise((r) => setTimeout(r, 3000));
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
