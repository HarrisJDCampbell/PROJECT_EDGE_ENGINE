/**
 * Projection Logger
 *
 * Batch-upserts each projection into Supabase `projection_logs` so we can
 * measure model accuracy after box scores come in.
 *
 * Uses upsert keyed on (player_name, stat, game_date) — re-running the
 * pipeline on the same day overwrites rather than duplicates.
 */

import { createClient } from '@supabase/supabase-js';
import logger from '../lib/logger';
import type { ProjectedProp } from '../routes/projections';

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Track whether we've already logged today's slate to avoid hammering Supabase
// on every cache miss. Reset at midnight by the date key.
let lastLoggedDate = '';

export async function logProjections(projections: ProjectedProp[]): Promise<void> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const today = new Date().toISOString().split('T')[0];

  // Only log once per day per server process (the cache already deduplicates
  // pipeline runs, but guard again here in case of cache invalidation).
  if (lastLoggedDate === today) return;
  lastLoggedDate = today;

  const rows = projections.map((p) => ({
    player_name:   p.playerName,
    stat:          p.stat,
    line:          p.line,
    projection:    p.projection,
    p_over:        p.pOver,
    visbets_score: p.visbetsScore,
    direction:     p.direction,
    bookmaker:     p.bookmaker,
    model_version: p.modelVersion,
    game_date:     today,
  }));

  const { error } = await supabase
    .from('projection_logs')
    .upsert(rows, { onConflict: 'player_name,stat,game_date' });

  if (error) {
    logger.warn({ err: error.message }, '[ProjectionLogger] Upsert failed');
  } else {
    logger.info({ count: rows.length, date: today }, '[ProjectionLogger] Logged projections');
  }
}
