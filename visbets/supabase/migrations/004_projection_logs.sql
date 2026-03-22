-- Migration 004: Projection accuracy logging
-- Stores every projection generated so we can compare against actual box scores
-- and measure model accuracy over time.
-- Safe to re-run: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.projection_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name    text NOT NULL,
  stat           text NOT NULL,
  line           numeric NOT NULL,
  projection     numeric NOT NULL,
  p_over         numeric NOT NULL,
  visbets_score  numeric NOT NULL,
  direction      text NOT NULL CHECK (direction IN ('over', 'under')),
  bookmaker      text,
  model_version  text NOT NULL,
  game_date      date NOT NULL,
  actual_value   numeric,     -- filled in later when box score arrives
  hit            boolean,     -- true = prediction correct, false = wrong, null = pending
  created_at     timestamptz NOT NULL DEFAULT now(),

  -- One log entry per player/stat/date combination per pipeline run
  UNIQUE (player_name, stat, game_date)
);

CREATE INDEX IF NOT EXISTS idx_projection_logs_date       ON public.projection_logs(game_date);
CREATE INDEX IF NOT EXISTS idx_projection_logs_player     ON public.projection_logs(player_name, game_date);
CREATE INDEX IF NOT EXISTS idx_projection_logs_accuracy   ON public.projection_logs(game_date, hit) WHERE hit IS NOT NULL;

-- Backend writes only (service role key). No client-side access.
ALTER TABLE public.projection_logs ENABLE ROW LEVEL SECURITY;
