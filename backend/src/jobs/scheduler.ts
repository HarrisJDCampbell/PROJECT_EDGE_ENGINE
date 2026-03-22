/**
 * Cron Scheduler
 *
 * Schedules:
 *   - Nightly ingest: 11:00 UTC daily
 *       → 06:00 ET (EST, Nov–Mar) / 07:00 ET (EDT, Mar–Nov)
 *       Both times are before games start so the shift is harmless.
 *   - Odds refresh:   Every 30 min, 16:00–04:00 UTC
 *       → Covers ~11 AM – 11 PM ET (shifts ±1 hour with DST)
 *
 * Uses node-cron (cron syntax) with explicit timezone: 'UTC' for predictability.
 */

import cron from 'node-cron';
import logger from '../lib/logger';
import { runNightlyIngest } from './nightlyIngest';
import { runOddsRefresh } from './oddsRefresh';

let schedulerStarted = false;

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // ── Nightly ingest: 11:00 UTC = 06:00 ET ──────────────────────────────────
  cron.schedule('0 11 * * *', async () => {
    logger.info('[Scheduler] Running nightly ingest');
    try {
      await runNightlyIngest();
    } catch (err: any) {
      logger.error({ err: err.message }, '[Scheduler] Nightly ingest threw');
    }
  }, { timezone: 'UTC' });

  // ── Odds refresh: every 30 min from 16:00–04:00 UTC (11 AM – 11 PM ET) ───
  // "*/30 16-23,0-4 * * *" covers 16:00–04:30 UTC = ~11 AM – 11:30 PM ET
  cron.schedule('*/30 16-23 * * *', async () => {
    logger.info('[Scheduler] Running odds refresh (evening window)');
    try {
      await runOddsRefresh();
    } catch (err: any) {
      logger.error({ err: err.message }, '[Scheduler] Odds refresh threw');
    }
  }, { timezone: 'UTC' });

  // Also cover the 0–4 UTC window (7 PM – 11 PM ET for late West Coast games)
  cron.schedule('*/30 0-4 * * *', async () => {
    logger.info('[Scheduler] Running odds refresh (late window)');
    try {
      await runOddsRefresh();
    } catch (err: any) {
      logger.error({ err: err.message }, '[Scheduler] Odds refresh threw');
    }
  }, { timezone: 'UTC' });

  logger.info('[Scheduler] Cron jobs registered: nightly ingest + odds refresh');
}
