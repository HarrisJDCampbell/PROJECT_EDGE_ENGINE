-- 007_user_preferences_fix.sql
-- Creates the user_preferences table that onboardingStore and authStore expect.
-- The old user_sportsbooks/user_sports tables remain for backward compat
-- but are no longer the primary storage mechanism.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sportsbooks TEXT[]      NOT NULL DEFAULT '{}',
  sports      TEXT[]      NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_prefs" ON user_preferences;
CREATE POLICY "users_own_prefs" ON user_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON user_preferences TO authenticated;

-- Also allow service role (for backend reads if needed)
GRANT ALL ON user_preferences TO service_role;
