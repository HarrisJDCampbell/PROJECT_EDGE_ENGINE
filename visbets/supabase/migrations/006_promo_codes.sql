-- ============================================================
-- 006_promo_codes.sql
-- Beta promo code system.
-- Admins insert codes manually via Supabase dashboard.
-- Users redeem codes via POST /api/promo/redeem.
-- ============================================================
-- Drop the conflicting policy first, then re-run your function
DROP POLICY IF EXISTS "service_role_all" ON promo_codes;

-- Now paste the rest of your redeem_promo_code function below this line
CREATE TABLE IF NOT EXISTS promo_codes (
  code          TEXT          PRIMARY KEY,
  promo_tier    TEXT          NOT NULL CHECK (promo_tier IN ('starter', 'pro')),
  duration_days INTEGER       NOT NULL DEFAULT 30,
  max_uses      INTEGER,                          -- NULL = unlimited
  used_count    INTEGER       NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,                      -- NULL = no expiry on the code itself
  note          TEXT,                             -- admin label, e.g. "beta testers March 2026"
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- RLS: backend service-role only
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON promo_codes USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code             TEXT          NOT NULL REFERENCES promo_codes(code),
  promo_tier       TEXT          NOT NULL,
  redeemed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  promo_expires_at TIMESTAMPTZ   NOT NULL,
  UNIQUE (user_id, code)          -- one redemption per code per user
);

CREATE INDEX IF NOT EXISTS promo_redemptions_user_idx    ON promo_redemptions (user_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_expires_idx ON promo_redemptions (promo_expires_at);

ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON promo_redemptions USING (true) WITH CHECK (true);

-- ── Seed: BETA2026 — gives 30 days of Pro access, up to 50 uses ──────────────
INSERT INTO promo_codes (code, promo_tier, duration_days, max_uses, note)
VALUES ('BETA2026', 'pro', 30, 50, 'Initial beta launch — March 2026')
ON CONFLICT (code) DO NOTHING;
