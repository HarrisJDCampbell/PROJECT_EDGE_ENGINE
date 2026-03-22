-- ============================================================
-- 005_data_pipeline.sql
-- Persistent data buckets for the nightly ingestion pipeline.
-- Eliminates on-demand API-Sports & TheOddsAPI calls from user requests.
-- ============================================================

-- ── Player game logs (populated nightly by ingest job) ──────────────────────
CREATE TABLE IF NOT EXISTS game_logs (
  id            BIGSERIAL PRIMARY KEY,
  player_id     INTEGER       NOT NULL,
  player_name   TEXT          NOT NULL,
  game_date     DATE          NOT NULL,
  game_id       INTEGER,
  team_id       INTEGER,
  team_name     TEXT,
  opponent_name TEXT,
  is_home       BOOLEAN,
  game_result   TEXT,
  minutes       NUMERIC,
  pts           NUMERIC,
  reb           NUMERIC,
  ast           NUMERIC,
  tpm           NUMERIC,
  stl           NUMERIC,
  blk           NUMERIC,
  turnovers     NUMERIC,
  plus_minus    TEXT,
  fetched_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, game_date)
);

CREATE INDEX IF NOT EXISTS game_logs_player_id_idx    ON game_logs (player_id);
CREATE INDEX IF NOT EXISTS game_logs_player_name_idx  ON game_logs (lower(player_name));
CREATE INDEX IF NOT EXISTS game_logs_game_date_idx    ON game_logs (game_date DESC);

-- RLS: backend service-role only (no user-level access needed)
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON game_logs USING (true) WITH CHECK (true);

-- ── Pre-computed projections (populated nightly, read by /projections/today) ─
CREATE TABLE IF NOT EXISTS pre_computed_props (
  id              BIGSERIAL PRIMARY KEY,
  game_date       DATE          NOT NULL,
  player_id       INTEGER,
  player_name     TEXT          NOT NULL,
  team_name       TEXT,
  opponent        TEXT,
  is_home         BOOLEAN,
  game_time       TIMESTAMPTZ,
  stat            TEXT          NOT NULL,
  stat_display    TEXT          NOT NULL,
  line            NUMERIC,
  projection      NUMERIC,
  std_dev         NUMERIC,
  p_over          NUMERIC,
  implied_p_over  NUMERIC,
  edge            NUMERIC,
  direction       TEXT,
  visbets_score   INTEGER,
  confidence      TEXT,
  sample_size     INTEGER,
  over_odds       NUMERIC,
  under_odds      NUMERIC,
  bookmaker       TEXT,
  model_version   TEXT,
  headshot_url    TEXT,
  computed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (game_date, player_name, stat)
);

CREATE INDEX IF NOT EXISTS pre_computed_props_date_idx   ON pre_computed_props (game_date DESC);
CREATE INDEX IF NOT EXISTS pre_computed_props_player_idx ON pre_computed_props (player_id);
CREATE INDEX IF NOT EXISTS pre_computed_props_stat_idx   ON pre_computed_props (stat);
CREATE INDEX IF NOT EXISTS pre_computed_props_score_idx  ON pre_computed_props (visbets_score DESC);

ALTER TABLE pre_computed_props ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON pre_computed_props USING (true) WITH CHECK (true);

-- ── Player metadata cache (updated weekly) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS player_metadata (
  player_id     INTEGER       PRIMARY KEY,
  full_name     TEXT          NOT NULL,
  team_id       INTEGER,
  team_name     TEXT,
  position      TEXT,
  headshot_url  TEXT,
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE player_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON player_metadata USING (true) WITH CHECK (true);

-- ── Daily schedule (populated nightly, read by /games/today) ─────────────────
CREATE TABLE IF NOT EXISTS daily_schedule (
  id            BIGSERIAL PRIMARY KEY,
  game_id       INTEGER       NOT NULL,
  game_date     DATE          NOT NULL,
  home_team_id  INTEGER       NOT NULL,
  home_team     TEXT          NOT NULL,
  away_team_id  INTEGER       NOT NULL,
  away_team     TEXT          NOT NULL,
  game_time     TIMESTAMPTZ,
  status        TEXT,
  UNIQUE (game_id)
);

CREATE INDEX IF NOT EXISTS daily_schedule_date_idx ON daily_schedule (game_date DESC);

ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON daily_schedule USING (true) WITH CHECK (true);
