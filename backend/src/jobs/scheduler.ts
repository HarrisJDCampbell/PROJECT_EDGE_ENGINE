/**
 * Cron Scheduler
 *
 * Schedules:
 *   - Nightly ingest: 11:00 UTC daily (06:00 ET)
 *   - Odds refresh:
 *       Peak (23:00–04:00 UTC / 6 PM – 11 PM ET): every 10 min
 *       Off-peak (16:00–23:00, 04:00–06:00 UTC):  every 30 min
 *
 * Budget: TheOddsAPI 20K plan = 20,000 credits/month.
 *   ~33 credits per refresh (5 games avg), ~24 game days/month
 *   Peak:     5h × 6/hr = 30 cycles/day × 33 = 990 credits
 *   Off-peak: 11h × 2/hr = 22 cycles/day × 33 = 726 credits
 *   Daily total: ~1,716 credits × 25 days = ~17,160/month (fits 20K)
 */

import cron from 'node-cron';
import logger from '../lib/logger';
import { runNightlyIngest } from './nightlyIngest';
import { runOddsRefresh } from './oddsRefresh';

let schedulerStarted = false;
let oddsRefreshRunning = false;

async function safeOddsRefresh(): Promise<void> {
  if (oddsRefreshRunning) return;
  oddsRefreshRunning = true;
  try {
    await runOddsRefresh();
  } catch (err: any) {
    logger.error({ err: err.message }, '[Scheduler] Odds refresh threw');
  } finally {
    oddsRefreshRunning = false;
  }
}

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

  // ── Peak: every 10 min, 23:00–04:00 UTC (6 PM – 11 PM ET) ────────────────
  // This is when most NBA games are live — freshest odds matter most.
  cron.schedule('*/10 23 * * *', safeOddsRefresh, { timezone: 'UTC' });
  cron.schedule('*/10 0-3 * * *', safeOddsRefresh, { timezone: 'UTC' });

  // ── Off-peak: every 30 min, 16:00–22:00 UTC (11 AM – 5 PM ET) ────────────
  // Pre-game hours — lines are posted but move slowly.
  cron.schedule('*/30 16-22 * * *', safeOddsRefresh, { timezone: 'UTC' });

  // ── Late: every 30 min, 04:00–06:00 UTC (11 PM – 1 AM ET) ────────────────
  // West Coast late games winding down.
  cron.schedule('*/30 4-5 * * *', safeOddsRefresh, { timezone: 'UTC' });

  logger.info('[Scheduler] Cron jobs registered: nightly ingest + odds refresh (10 min peak / 30 min off-peak)');
}
