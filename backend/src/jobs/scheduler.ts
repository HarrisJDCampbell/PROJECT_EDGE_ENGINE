/**
 * Cron Scheduler
 *
 * Schedules:
 *   - Nightly ingest: 11:00 UTC daily (06:00 ET)
 *   - Odds refresh:   Every minute, 14:00–06:00 UTC (~9 AM – 1 AM ET)
 *
 * Uses node-cron (cron syntax) with explicit timezone: 'UTC' for predictability.
 */

import cron from 'node-cron';
import logger from '../lib/logger';
import { runNightlyIngest } from './nightlyIngest';
import { runOddsRefresh } from './oddsRefresh';

let schedulerStarted = false;
let oddsRefreshRunning = false;

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

  // ── Odds refresh: every minute, 14:00–06:00 UTC (~9 AM – 1 AM ET) ─────────
  // Guard against overlapping runs — if a refresh takes >60s, skip the next tick.
  cron.schedule('* 14-23 * * *', async () => {
    if (oddsRefreshRunning) return;
    oddsRefreshRunning = true;
    try {
      await runOddsRefresh();
    } catch (err: any) {
      logger.error({ err: err.message }, '[Scheduler] Odds refresh threw');
    } finally {
      oddsRefreshRunning = false;
    }
  }, { timezone: 'UTC' });

  // Late window: 0–6 UTC (7 PM – 1 AM ET for West Coast / late games)
  cron.schedule('* 0-6 * * *', async () => {
    if (oddsRefreshRunning) return;
    oddsRefreshRunning = true;
    try {
      await runOddsRefresh();
    } catch (err: any) {
      logger.error({ err: err.message }, '[Scheduler] Odds refresh threw');
    } finally {
      oddsRefreshRunning = false;
    }
  }, { timezone: 'UTC' });

  logger.info('[Scheduler] Cron jobs registered: nightly ingest + odds refresh (every 1 min)');
}
