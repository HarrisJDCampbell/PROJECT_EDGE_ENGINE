-- 008_saved_picks_actuals.sql
-- Add actual_value and hit columns to saved_picks for win rate tracking
ALTER TABLE saved_picks ADD COLUMN IF NOT EXISTS actual_value NUMERIC;
ALTER TABLE saved_picks ADD COLUMN IF NOT EXISTS hit BOOLEAN;
